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
    """Update or upsert profile fields for the authenticated user."""
    update_data = profile_update.model_dump(exclude_unset=True)

    if not update_data:
        existing = get_profile(client, user_id)
        if not existing:
            # Create a default profile
            new_profile = {"id": user_id, "full_name": "User", "preferred_currency": "INR"}
            res = client.table("profiles").insert(new_profile).execute()
            return res.data[0] if res.data else new_profile
        return existing

    try:
        # Check if record exists
        existing = get_profile(client, user_id)
        if not existing:
            # Upsert/Insert
            insert_data = {"id": user_id, **update_data}
            response = client.table("profiles").upsert(insert_data).execute()
            if response.data:
                return response.data[0]
            return insert_data

        # Update existing
        response = (
            client.table("profiles")
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            # Fallback to upsert
            response = client.table("profiles").upsert({"id": user_id, **update_data}).execute()
        return response.data[0] if response.data else {"id": user_id, **update_data}
    except Exception as exc:
        logger.error(f"Error updating profile for user {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {exc}",
        )
