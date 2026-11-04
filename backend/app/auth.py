import logging
from typing import Any, Dict, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client
from app.database import get_supabase_client

logger = logging.getLogger(__name__)

# Security scheme for Bearer token in Authorization header
http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    client: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """
    FastAPI dependency to verify Supabase JWT token and extract the authenticated user.
    Calls Supabase Auth to validate signature, expiration, and user state.
    Raises HTTP 401 if token is absent, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()

    try:
        # Ask Supabase Auth to verify the token and return user details
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = user_response.user
        return {
            "id": str(user.id),
            "email": user.email,
            "user_metadata": user.user_metadata or {},
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"JWT verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    client: Client = Depends(get_supabase_client),
) -> Optional[Dict[str, Any]]:
    """
    Optional auth dependency that returns user dict if valid token provided, else None.
    Allows backwards compatibility for transitional lab demonstration scripts.
    """
    if not credentials or not credentials.credentials:
        return None

    try:
        user_response = client.auth.get_user(credentials.credentials.strip())
        if user_response and user_response.user:
            return {
                "id": str(user_response.user.id),
                "email": user_response.user.email,
                "user_metadata": user_response.user.user_metadata or {},
            }
    except Exception:
        pass

    return None
