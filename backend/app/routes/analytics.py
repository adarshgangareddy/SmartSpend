from datetime import datetime
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query, status
from supabase import Client
from app.auth import get_current_user
from app.database import get_supabase_client
from app.schemas.transaction import FinancialSummary
from app.services import transaction_service
from app.services.currency_service import CurrencyService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/rates",
    status_code=status.HTTP_200_OK,
    summary="Get current exchange rates",
    description="Retrieve cached exchange rates against USD for multi-currency conversion.",
)
def get_exchange_rates(client: Client = Depends(get_supabase_client)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    rates = CurrencyService.get_usd_rates_for_date(today_str, client=client)
    return {
        "base": "USD",
        "date": today_str,
        "rates": {k: float(v) for k, v in rates.items()},
    }


@router.get(
    "/summary",
    response_model=FinancialSummary,
    status_code=status.HTTP_200_OK,
    summary="Financial summary",
    description="Calculate total income, total expenses, and net balance for the authenticated user.",
)
def get_financial_summary(
    currency: str = Query(
        "INR",
        min_length=3,
        max_length=3,
        description="Three-letter currency code (e.g., INR, USD)",
    ),
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Compute financial totals and balance for the authenticated user and requested currency."""
    return transaction_service.calculate_summary(
        client=client,
        currency=currency,
        user_id=current_user["id"],
    )
