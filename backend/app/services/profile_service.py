import logging
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from supabase import Client
from app.schemas.profile import ProfileUpdate

logger = logging.getLogger(__name__)


def get_profile(client: Client, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve profile record for the given user UUID."""
    try:
        response = (
            client.table("profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]
    except Exception as exc:
        logger.error(f"Error fetching profile for user {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile record from database.",
        )


def update_profile(
    client: Client, user_id: str, profile_update: ProfileUpdate
) -> Dict[str, Any]:
    """Update profile fields for the authenticated user."""
    update_data = profile_update.model_dump(exclude_unset=True)

    if not update_data:
        # Return existing profile if no fields were provided to update
        existing = get_profile(client, user_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found.",
            )
        return existing

    try:
        response = (
            client.table("profiles")
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found or cannot be updated.",
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error updating profile for user {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile due to a database error.",
        )

