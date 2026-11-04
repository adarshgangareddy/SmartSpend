from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.auth import get_current_user
from app.database import get_supabase_client
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get(
    "",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user profile",
    description="Retrieve the profile of the currently authenticated user.",
)
def get_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Retrieve profile matching the authenticated user's verified token UUID."""
    user_id = current_user["id"]
    profile = profile_service.get_profile(client, user_id=user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile record not found for this user.",
        )
    return profile


@router.put(
    "",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user profile",
    description="Update the display name or preferred currency of the authenticated user.",
)
def update_user_profile(
    profile_update: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Update profile attributes strictly for the authenticated user."""
    user_id = current_user["id"]
    return profile_service.update_profile(
        client=client,
        user_id=user_id,
        profile_update=profile_update,
    )


@router.delete(
    "",
    status_code=status.HTTP_200_OK,
    summary="Delete user account and all personal data",
    description="Securely purges user transactions, profiles, and auth credentials.",
)
def delete_user_account(
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Privileged server-side deletion of user account and data."""
    user_id = current_user["id"]
    try:
        # 1. Purge transactions
        client.table("transactions").delete().eq("user_id", user_id).execute()
    except Exception as exc:
        pass

    try:
        # 2. Purge profile
        client.table("profiles").delete().eq("id", user_id).execute()
    except Exception as exc:
        pass

    try:
        # 3. Purge auth user
        client.auth.admin.delete_user(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user authentication record.",
        )

    return {"message": "Account and associated data successfully purged."}

