from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TransactionType = Literal["income", "expense"]


class TransactionBase(BaseModel):
    """Shared transaction properties."""
    type: TransactionType = Field(
        ...,
        description="Type of transaction: 'income' or 'expense'",
        examples=["expense"],
    )
    amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Transaction amount (must be positive)",
        examples=[250.00],
    )
    category: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Category name (e.g., Food, Salary, Utilities)",
        examples=["Food"],
    )
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional transaction notes or details",
        examples=["Lunch with team"],
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        description="Three-letter currency code (e.g. INR, USD)",
        examples=["INR"],
    )
    transaction_date: date = Field(
        default_factory=date.today,
        description="Date of transaction (YYYY-MM-DD)",
        examples=["2026-11-04"],
    )

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, val: str) -> str:
        if isinstance(val, str):
            val = val.strip().lower()
            if val not in ("income", "expense"):
                raise ValueError("Transaction type must be 'income' or 'expense'")
        return val

    @field_validator("category")
    @classmethod
    def validate_category(cls, val: str) -> str:
        trimmed = val.strip()
        if not trimmed:
            raise ValueError("Category cannot be empty or whitespace only")
        return trimmed

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, val: str) -> str:
        if isinstance(val, str):
            val = val.strip().upper()
            if len(val) != 3 or not val.isalpha():
                raise ValueError("Currency must be a 3-letter alphabetic code (e.g., INR, USD)")
        return val


class TransactionCreate(TransactionBase):
    """Schema for creating a new transaction."""
    pass


class TransactionUpdate(BaseModel):
    """Schema for updating an existing transaction."""
    model_config = ConfigDict(extra="forbid")

    type: Optional[TransactionType] = Field(
        None,
        description="Type of transaction: 'income' or 'expense'",
    )
    amount: Optional[Decimal] = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Transaction amount (must be positive)",
    )
    category: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Category name",
    )
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional transaction notes",
    )
    currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="Three-letter currency code",
    )
    transaction_date: Optional[date] = Field(
        None,
        description="Date of transaction (YYYY-MM-DD)",
    )

    @field_validator("type", mode="before")
    @classmethod
    def normalize_update_type(cls, val: Optional[str]) -> Optional[str]:
        if val is not None and isinstance(val, str):
            val = val.strip().lower()
            if val not in ("income", "expense"):
                raise ValueError("Transaction type must be 'income' or 'expense'")
        return val

    @field_validator("category")
    @classmethod
    def validate_update_category(cls, val: Optional[str]) -> Optional[str]:
        if val is not None:
            trimmed = val.strip()
            if not trimmed:
                raise ValueError("Category cannot be empty or whitespace only")
            return trimmed
        return val

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_update_currency(cls, val: Optional[str]) -> Optional[str]:
        if val is not None and isinstance(val, str):
            val = val.strip().upper()
            if len(val) != 3 or not val.isalpha():
                raise ValueError("Currency must be a 3-letter alphabetic code (e.g., INR, USD)")
        return val

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> "TransactionUpdate":
        update_data = self.model_dump(exclude_unset=True)
        if not update_data:
            raise ValueError("Update payload must contain at least one field to update")
        return self


class TransactionResponse(BaseModel):
    """Schema for transaction API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[str] = None
    type: TransactionType
    amount: float
    category: str
    description: Optional[str] = None
    currency: str
    transaction_date: date
    created_at: datetime
    converted_amount: Optional[float] = None
    display_currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    is_converted: Optional[bool] = False


class FinancialSummary(BaseModel):
    """Schema for financial summary analytics."""
    total_income: float
    total_expenses: float
    balance: float
    currency: str
    is_converted: Optional[bool] = False
    transaction_count: Optional[int] = 0


class DeleteResponse(BaseModel):
    """Schema for deletion confirmation."""
    message: str
    id: int

