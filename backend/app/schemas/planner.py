from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

UrgencyLevel = Literal["immediate", "upcoming", "long_term"]
ItemStatus = Literal["pending", "bought", "archived"]


class PlannedItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150, description="Name of the item to buy")
    estimated_amount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        description="Estimated price or budget for this item",
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        description="Three-letter currency code (e.g., INR, USD)",
    )
    category: str = Field(
        default="Other",
        max_length=50,
        description="Category classification (e.g., Food, Travel, Education)",
    )
    urgency: UrgencyLevel = Field(
        default="upcoming",
        description="Urgency tier: immediate (urgent/needed now), upcoming (event/near future), long_term (future goal)",
    )
    event_tag: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Optional bundle tag (e.g., 'College', 'Japan Trip', 'Daily Essentials')",
    )
    target_date: Optional[date] = Field(
        default=None,
        description="Target deadline date (YYYY-MM-DD)",
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Optional additional details or notes",
    )

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("title", "category")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        val = v.strip()
        if not val:
            raise ValueError("Field cannot be empty or whitespace only")
        return val


class PlannedItemCreate(PlannedItemBase):
    pass


class PlannedItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    estimated_amount: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    category: Optional[str] = Field(None, max_length=50)
    urgency: Optional[UrgencyLevel] = None
    event_tag: Optional[str] = Field(None, max_length=50)
    target_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[ItemStatus] = None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class ConvertPlannedItemRequest(BaseModel):
    actual_amount: Optional[Decimal] = Field(
        default=None,
        gt=0,
        description="Actual amount paid. If omitted, uses estimated_amount.",
    )
    transaction_date: Optional[date] = Field(
        default=None,
        description="Date of purchase. If omitted, defaults to today.",
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional custom description for the created transaction.",
    )


class PlannedItemResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    title: str
    estimated_amount: float
    currency: str
    category: str
    urgency: str
    event_tag: Optional[str] = None
    target_date: Optional[date] = None
    notes: Optional[str] = None
    status: str
    converted_transaction_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

