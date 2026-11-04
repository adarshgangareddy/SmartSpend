from fastapi import APIRouter, Depends, Query, status
from supabase import Client
from app.database import get_supabase_client
from app.schemas.transaction import FinancialSummary
from app.services import transaction_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/summary",
    response_model=FinancialSummary,
    status_code=status.HTTP_200_OK,
    summary="Financial summary",
    description="Calculate total income, total expenses, and net balance for a specified currency.",
)
def get_financial_summary(
    currency: str = Query(
        "INR",
        min_length=3,
        max_length=3,
        description="Three-letter currency code (e.g., INR, USD)",
    ),
    client: Client = Depends(get_supabase_client),
):
    """Compute financial totals and balance for the requested currency."""
    return transaction_service.calculate_summary(client, currency=currency)
