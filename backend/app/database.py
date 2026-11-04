from typing import Optional
from fastapi import HTTPException, status
from supabase import create_client, Client
from app.config import settings

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Retrieves or initializes the Supabase client.
    Handles missing or placeholder credentials safely without exposing secrets.
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

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return _supabase_client
    except Exception as exc:
        # Avoid leaking internal connection strings or credentials
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to establish connection to Supabase service.",
        )
