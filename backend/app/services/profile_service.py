import logging
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from supabase import Client
from app.schemas.profile import ProfileUpdate

logger = logging.getLogger(__name__)

CORE_PROFILE_COLUMNS = {"id", "full_name", "preferred_currency"}


def get_profile(client: Client, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve profile record for the given user UUID, merged with user_metadata."""
    profile_data: Dict[str, Any] = {"id": user_id}
    try:
        response = (
            client.table("profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if response.data:
            profile_data.update(response.data[0])
    except Exception as exc:
        logger.warning(f"Could not fetch table record from public.profiles: {exc}")

    # Fetch extended user_metadata from Supabase Auth admin
    try:
        user_res = client.auth.admin.get_user_by_id(user_id)
        if user_res and user_res.user:
            u_meta = user_res.user.user_metadata or {}
            for field in ("full_name", "bio", "phone", "location", "dob", "avatar_url", "theme", "date_format"):
                if field in u_meta and not profile_data.get(field):
                    profile_data[field] = u_meta[field]
    except Exception as exc:
        logger.debug(f"Could not retrieve auth user metadata: {exc}")

    # Ensure required fields for ProfileResponse are always present
    profile_data["id"] = user_id
    if not profile_data.get("preferred_currency"):
        profile_data["preferred_currency"] = "INR"

    return profile_data


def update_profile(
    client: Client, user_id: str, profile_update: ProfileUpdate
) -> Dict[str, Any]:
    """Update profile fields safely handling database schema variations and user_metadata."""
    update_data = profile_update.model_dump(exclude_unset=True)

    if not update_data:
        existing = get_profile(client, user_id)
        return existing or {"id": user_id, "full_name": "User", "preferred_currency": "INR"}

    # 1. Update user_metadata in Supabase Auth to guarantee persistence of bio, phone, location, etc.
    try:
        user_res = client.auth.admin.get_user_by_id(user_id)
        current_meta = (user_res.user.user_metadata or {}) if (user_res and user_res.user) else {}
        merged_meta = {**current_meta, **update_data}
        client.auth.admin.update_user_by_id(user_id, {"user_metadata": merged_meta})
    except Exception as meta_exc:
        logger.warning(f"Failed to sync user_metadata for user {user_id}: {meta_exc}")

    # 2. Update public.profiles table (handling missing columns gracefully)
    try:
        # Try full update first
        existing_res = client.table("profiles").select("id").eq("id", user_id).limit(1).execute()
        if existing_res.data:
            response = client.table("profiles").update(update_data).eq("id", user_id).execute()
        else:
            response = client.table("profiles").insert({"id": user_id, **update_data}).execute()
        
        result = response.data[0] if response.data else {"id": user_id, **update_data}
        return {"id": user_id, "preferred_currency": "INR", **merged_meta, **result}
    except Exception as exc:
        err_str = str(exc)
        # If columns like 'bio', 'phone', etc. don't exist in public.profiles schema
        if "schema cache" in err_str or "PGRST204" in err_str or "column" in err_str:
            logger.info(f"Filtering to core columns for profiles table due to schema difference: {err_str}")
            core_data = {k: v for k, v in update_data.items() if k in CORE_PROFILE_COLUMNS}
            if core_data:
                try:
                    existing_res = client.table("profiles").select("id").eq("id", user_id).limit(1).execute()
                    if existing_res.data:
                        client.table("profiles").update(core_data).eq("id", user_id).execute()
                    else:
                        client.table("profiles").insert({"id": user_id, **core_data}).execute()
                except Exception as inner_exc:
                    logger.warning(f"Core profile table update failed: {inner_exc}")
            
            # Return complete updated profile including user_metadata fields
            merged = get_profile(client, user_id)
            return merged or {"id": user_id, **update_data}
        
        logger.error(f"Error updating profile for user {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {exc}",
        )
