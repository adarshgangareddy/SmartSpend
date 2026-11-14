import logging
from typing import Any, Dict, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client
from app.database import get_supabase_admin_client, get_supabase_client

logger = logging.getLogger(__name__)
http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> Dict[str, Any]:
    """Verify a Supabase bearer token and return user identity."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        client = get_supabase_client()
        user_response = client.auth.get_user(credentials.credentials.strip())
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = user_response.user
        app_meta = user.app_metadata or {}
        user_meta = user.user_metadata or {}
        is_google = app_meta.get("provider") == "google" or "google" in app_meta.get("providers", [])
        is_verified = (
            is_google
            or bool(user_meta.get("email_verified"))
            or getattr(user, "email_confirmed_at", None) is not None
            or getattr(user, "confirmed_at", None) is not None
        )
        if not is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your email address has not been verified yet. Please check your inbox for the confirmation link.",
            )

        user_id = str(user.id)
        return {
            "id": user_id,
            "email": user.email,
            "user_metadata": user.user_metadata or {},
            "role": "user",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Supabase token verification failed (%s).", type(exc).__name__)
        if isinstance(exc, (TimeoutError, ConnectionError)) or any(
            marker in type(exc).__name__.lower()
            for marker in ("timeout", "connection", "ssl")
        ):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service is temporarily unavailable.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> Optional[Dict[str, Any]]:
    """Return the authenticated user when a valid bearer token is supplied."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(
            credentials=credentials,
        )
    except Exception:
        return None
