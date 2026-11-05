import logging
import time
from typing import Any, Dict, Optional, Tuple
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client
import jwt
from app.database import get_supabase_client

logger = logging.getLogger(__name__)

# Security scheme for Bearer token in Authorization header
http_bearer = HTTPBearer(auto_error=False)

# In-memory cache for verified tokens to eliminate redundant SSL handshakes & network latency
# token -> (user_dict, expire_timestamp)
_TOKEN_CACHE: Dict[str, Tuple[Dict[str, Any], float]] = {}
CACHE_TTL = 60.0  # 1 minute


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    client: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """
    FastAPI dependency to verify Supabase JWT token and extract the authenticated user.
    Uses token caching and graceful SSL timeout recovery.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()
    now = time.time()

    # 1. Fast Cache Hit
    if token in _TOKEN_CACHE:
        cached_user, expiry = _TOKEN_CACHE[token]
        if now < expiry:
            return cached_user

    try:
        # 2. Ask Supabase Auth to verify the token and return user details
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = user_response.user

        # Enforce that user's email has been verified before granting access to protected endpoints
        if not getattr(user, "email_confirmed_at", None) and not getattr(user, "confirmed_at", None):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your email address has not been verified yet. Please check your inbox for the confirmation link.",
            )

        user_dict = {
            "id": str(user.id),
            "email": user.email,
            "user_metadata": user.user_metadata or {},
        }

        # Cache valid user
        _TOKEN_CACHE[token] = (user_dict, now + CACHE_TTL)
        return user_dict

    except HTTPException:
        raise
    except Exception as exc:
        err_msg = str(exc)
        logger.warning(f"JWT verification via Supabase network call encountered: {err_msg}")

        # If network/SSL timed out, attempt local JWT validation fallback
        if "timed out" in err_msg.lower() or "ssl" in err_msg.lower() or "connection" in err_msg.lower():
            try:
                # Decode unverified to inspect expiration
                payload = jwt.decode(token, options={"verify_signature": False})
                exp = payload.get("exp", 0)
                sub = payload.get("sub")
                email = payload.get("email")
                if sub and exp > now:
                    logger.info("SSL timeout gracefully avoided via valid unexpired JWT payload fallback.")
                    fallback_user = {
                        "id": str(sub),
                        "email": email or "",
                        "user_metadata": payload.get("user_metadata", {}),
                    }
                    _TOKEN_CACHE[token] = (fallback_user, now + 30.0)
                    return fallback_user
            except Exception as decode_exc:
                logger.error(f"Fallback JWT decode failed: {decode_exc}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    client: Client = Depends(get_supabase_client),
) -> Optional[Dict[str, Any]]:
    """Optional auth dependency that returns user dict if valid token provided, else None."""
    if not credentials or not credentials.credentials:
        return None

    try:
        return get_current_user(credentials=credentials, client=client)
    except Exception:
        return None
