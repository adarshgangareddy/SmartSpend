import logging
from typing import Any, Dict, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client
from app.database import get_supabase_admin_client, get_supabase_client

logger = logging.getLogger(__name__)
http_bearer = HTTPBearer(auto_error=False)
VALID_ROLES = {"admin", "user"}


def get_user_role(client: Client, user_id: str) -> str:
    """Read the authoritative role from the server-managed profiles record."""
    try:
        response = (
            client.table("profiles")
            .select("role")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if response.data:
            role = response.data[0].get("role")
            if role in VALID_ROLES:
                return role
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="User role is not configured correctly.",
            )

        # Backfill a missing trigger-created profile without granting privileges.
        client.table("profiles").upsert({"id": user_id, "role": "user"}).execute()
        return "user"
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Unable to resolve authenticated user's role (%s).", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify user authorization.",
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> Dict[str, Any]:
    """Verify a Supabase bearer token and attach its server-managed role."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        client = get_supabase_client()
        admin_client = get_supabase_admin_client()
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
            "role": get_user_role(admin_client, user_id),
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


def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Require a verified user whose server-managed profile role is admin."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges are required.",
        )
    return current_user


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
