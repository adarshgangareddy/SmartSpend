import logging
import re
from datetime import date, datetime
from typing import Any, Dict, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from supabase import Client

from app.auth import require_admin
from app.database import get_supabase_admin_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["admin", "user"] = "user"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("A valid email address is required.")
        return value


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: Optional[str] = Field(None, min_length=3, max_length=255)
    password: Optional[str] = Field(None, min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("A valid email address is required.")
        return value

    @model_validator(mode="after")
    def require_changes(self):
        if self.email is None and self.password is None:
            raise ValueError("Provide an email address, password, or both.")
        return self


def _value(user: Any, key: str) -> Any:
    if isinstance(user, dict):
        return user.get(key)
    return getattr(user, key, None)


def _isoformat(value: Any) -> Optional[str]:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value if isinstance(value, str) else None


def _safe_user(user: Any, role: str = "user") -> Dict[str, Any]:
    """Explicitly whitelist public user fields; never return Auth secrets or metadata."""
    return {
        "id": str(_value(user, "id")),
        "email": _value(user, "email"),
        "role": role,
        "created_at": _isoformat(_value(user, "created_at")),
        "last_sign_in_at": _isoformat(_value(user, "last_sign_in_at")),
    }


def _raise_admin_error(exc: Exception, *, operation: str) -> None:
    message = str(exc).lower()
    logger.warning("Supabase admin %s failed (%s).", operation, type(exc).__name__)
    if any(term in message for term in ("already registered", "already exists", "duplicate", "email_exists")):
        raise HTTPException(status_code=409, detail="A user with this email already exists.")
    if any(term in message for term in ("not found", "user not found", "no user")):
        raise HTTPException(status_code=404, detail="User not found.")
    if any(term in message for term in ("invalid", "password", "email address", "weak")):
        raise HTTPException(status_code=400, detail="Supplied user data is invalid.")
    if any(
        term in type(exc).__name__.lower() or term in message
        for term in ("timeout", "connection", "ssl", "temporarily unavailable")
    ):
        raise HTTPException(status_code=503, detail="Supabase Auth is temporarily unavailable.")
    raise HTTPException(status_code=500, detail=f"Unable to {operation} user.")


def _extract_user(response: Any) -> Any:
    return getattr(response, "user", None) or response


def _auth_users(client: Client) -> list[Any]:
    """Page through Auth users so response total remains accurate."""
    users: list[Any] = []
    page = 1
    page_size = 1000
    while True:
        page_result = client.auth.admin.list_users(page=page, per_page=page_size)
        batch = getattr(page_result, "users", page_result) or []
        if not isinstance(batch, list):
            batch = list(batch)
        users.extend(batch)
        if len(batch) < page_size:
            return users
        page += 1


@router.get("/users", status_code=status.HTTP_200_OK)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    _admin: Dict[str, Any] = Depends(require_admin),
    client: Client = Depends(get_supabase_admin_client),
):
    """List registered Auth users with only non-sensitive account fields."""
    try:
        auth_users = _auth_users(client)
        profile_response = client.table("profiles").select("id,role").execute()
        roles = {
            str(profile.get("id")): profile.get("role")
            for profile in (profile_response.data or [])
            if profile.get("role") in ("admin", "user")
        }
        start = (page - 1) * per_page
        users = [
            _safe_user(user, roles.get(str(_value(user, "id")), "user"))
            for user in auth_users[start : start + per_page]
        ]
        return {"users": users, "total": len(auth_users), "page": page, "per_page": per_page}
    except HTTPException:
        raise
    except Exception as exc:
        _raise_admin_error(exc, operation="list")


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    request: UserCreate,
    _admin: Dict[str, Any] = Depends(require_admin),
    client: Client = Depends(get_supabase_admin_client),
):
    """Create a Supabase Auth user and persist the requested default-safe role."""
    created = None
    try:
        created = _extract_user(
            client.auth.admin.create_user(
                {"email": request.email, "password": request.password}
            )
        )
        user_id = str(_value(created, "id"))
        if not user_id or user_id == "None":
            raise RuntimeError("Auth did not return a user identifier")
        try:
            client.table("profiles").upsert({"id": user_id, "role": request.role}).execute()
        except Exception:
            # Avoid leaving an Auth account behind if role persistence fails.
            client.auth.admin.delete_user(user_id)
            raise
        return {"user": _safe_user(created, request.role)}
    except HTTPException:
        raise
    except Exception as exc:
        _raise_admin_error(exc, operation="create")


@router.put("/users/{user_id}", status_code=status.HTTP_200_OK)
def update_user(
    user_id: UUID,
    request: UserUpdate,
    _admin: Dict[str, Any] = Depends(require_admin),
    client: Client = Depends(get_supabase_admin_client),
):
    """Update a user's email and/or password; role changes are not accepted here."""
    try:
        updated = _extract_user(
            client.auth.admin.update_user_by_id(
                str(user_id), request.model_dump(exclude_none=True)
            )
        )
        if not _value(updated, "id"):
            raise HTTPException(status_code=404, detail="User not found.")
        profile = (
            client.table("profiles")
            .select("role")
            .eq("id", str(user_id))
            .limit(1)
            .execute()
        )
        role = profile.data[0].get("role", "user") if profile.data else "user"
        return {"user": _safe_user(updated, role)}
    except HTTPException:
        raise
    except Exception as exc:
        _raise_admin_error(exc, operation="update")


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: UUID,
    current_admin: Dict[str, Any] = Depends(require_admin),
    client: Client = Depends(get_supabase_admin_client),
):
    """Delete an Auth user, refusing self-deletion to prevent admin lockout."""
    if str(user_id) == str(current_admin.get("id")):
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account.")
    try:
        existing = client.auth.admin.get_user_by_id(str(user_id))
        if not getattr(existing, "user", None):
            raise HTTPException(status_code=404, detail="User not found.")
        client.auth.admin.delete_user(str(user_id))
        return {"message": "User deleted successfully.", "id": str(user_id)}
    except HTTPException:
        raise
    except Exception as exc:
        _raise_admin_error(exc, operation="delete")