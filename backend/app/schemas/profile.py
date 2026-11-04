from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileBase(BaseModel):
    """Base profile schema."""
    full_name: Optional[str] = Field(None, max_length=150, description="User's full display name")
    preferred_currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        description="Three-letter preferred currency code (e.g., INR, USD)",
    )
    avatar_url: Optional[str] = Field(None, description="URL or avatar path")
    bio: Optional[str] = Field(None, max_length=500, description="Short user bio")
    phone: Optional[str] = Field(None, max_length=30, description="Optional phone number")
    location: Optional[str] = Field(None, max_length=100, description="Optional location/city")
    dob: Optional[str] = Field(None, max_length=20, description="Optional date of birth")
    theme: Optional[str] = Field("lavender-glass", max_length=40, description="Active interface theme")
    date_format: Optional[str] = Field("DD/MM/YYYY", max_length=20, description="Preferred date format")

    @field_validator("preferred_currency", mode="before")
    @classmethod
    def normalize_currency(cls, val: str) -> str:
        if isinstance(val, str):
            val = val.strip().upper()
            if len(val) != 3 or not val.isalpha():
                raise ValueError("Currency must be a 3-letter alphabetic code (e.g., INR, USD)")
        return val


class ProfileUpdate(BaseModel):
    """
    Schema for updating user profile.
    Explicitly prevents client from modifying id or user_id.
    """
    model_config = ConfigDict(extra="forbid")

    full_name: Optional[str] = Field(None, max_length=150, description="User's full display name")
    preferred_currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="Three-letter preferred currency code",
    )
    avatar_url: Optional[str] = Field(None, description="URL or avatar path")
    bio: Optional[str] = Field(None, max_length=500, description="Short user bio")
    phone: Optional[str] = Field(None, max_length=30, description="Optional phone number")
    location: Optional[str] = Field(None, max_length=100, description="Optional location/city")
    dob: Optional[str] = Field(None, max_length=20, description="Optional date of birth")
    theme: Optional[str] = Field(None, max_length=40, description="Active interface theme")
    date_format: Optional[str] = Field(None, max_length=20, description="Preferred date format")

    @field_validator("preferred_currency", mode="before")
    @classmethod
    def normalize_currency(cls, val: Optional[str]) -> Optional[str]:
        if val is not None and isinstance(val, str):
            val = val.strip().upper()
            if len(val) != 3 or not val.isalpha():
                raise ValueError("Currency must be a 3-letter alphabetic code (e.g., INR, USD)")
        return val


class ProfileResponse(BaseModel):
    """Schema for profile API response."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: Optional[str] = None
    preferred_currency: str = "INR"
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    dob: Optional[str] = None
    theme: Optional[str] = "lavender-glass"
    date_format: Optional[str] = "DD/MM/YYYY"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
