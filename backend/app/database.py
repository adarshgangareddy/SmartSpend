from typing import Optional
from fastapi import HTTPException, status
from supabase import create_client, Client
from app.config import settings

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Retrieves or initializes the Supabase client.
    Prioritizes the service role / secret key if configured so database operations
    enforce server-side user_id scoping without being blocked by anonymous RLS.
    Falls back to SUPABASE_KEY when service role key is not explicitly set.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not settings.is_supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database connection is not configured. "
                "Please provide valid SUPABASE_URL and SUPABASE_KEY in backend/.env."
            ),
        )

    # Prioritize privileged service role key if available for server-side operations
    key_to_use = (
        settings.SUPABASE_SERVICE_ROLE_KEY
        if settings.is_supabase_admin_configured()
        else settings.SUPABASE_KEY
    )

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, key_to_use)
        return _supabase_client
    except Exception as exc:
        # Avoid leaking internal connection strings or credentials
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to establish connection to Supabase service.",
        )


def get_supabase_admin_client() -> Client:
    """Return a privileged client configured only with the backend service key."""
    global _supabase_admin_client

    if _supabase_admin_client is not None:
        return _supabase_admin_client

    if not settings.is_supabase_admin_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase administrative operations are not configured.",
        )

    try:
        _supabase_admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        return _supabase_admin_client
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to establish an administrative connection to Supabase.",
        )

