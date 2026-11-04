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
    created_at: datetime
    updated_at: datetime
