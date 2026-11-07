import logging
from datetime import date
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from supabase import Client
from app.schemas.transaction import (
    FinancialSummary,
    TransactionCreate,
    TransactionUpdate,
)
from app.services.currency_service import CurrencyService

logger = logging.getLogger(__name__)


def _format_db_error(exc: Exception, default_msg: str) -> str:
    """Extract a user-friendly database or API error message."""
    if hasattr(exc, "message") and isinstance(exc.message, str) and exc.message:
        return f"{default_msg}: {exc.message}"
    if hasattr(exc, "args") and exc.args:
        first_arg = exc.args[0]
        if isinstance(first_arg, dict):
            msg = first_arg.get("message") or first_arg.get("details")
            if msg:
                return f"{default_msg}: {msg}"
        elif isinstance(first_arg, str) and first_arg:
            return f"{default_msg}: {first_arg}"
    err_str = str(exc)
    if err_str:
        return f"{default_msg}: {err_str}"
    return default_msg


def create_transaction(
    client: Client, transaction_in: TransactionCreate, user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Insert a new transaction record into Supabase, binding user_id."""
    payload = transaction_in.model_dump()
    payload["amount"] = float(transaction_in.amount)
    payload["transaction_date"] = transaction_in.transaction_date.isoformat()

    if user_id:
        payload["user_id"] = user_id

    try:
        response = client.table("transactions").insert(payload).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database failed to persist transaction record.",
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error creating transaction: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_format_db_error(exc, "Failed to create transaction"),
        )


def get_transactions(
    client: Client,
    user_id: Optional[str] = None,
    tx_type: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    display_currency: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve transactions filtered strictly by the authenticated user's ID.
    If display_currency is provided, calculates converted_amount, exchange_rate,
    and is_converted using historical exchange rates for the transaction date.
    Original amount and currency are never modified.
    """
    try:
        query = client.table("transactions").select("*")

        if user_id:
            query = query.eq("user_id", user_id)

        if tx_type:
            query = query.eq("type", tx_type.lower())

        if category:
            query = query.ilike("category", f"%{category}%")

        if start_date:
            query = query.gte("transaction_date", start_date.isoformat())

        if end_date:
            query = query.lte("transaction_date", end_date.isoformat())

        # Sort descending by transaction date, then by ID
        query = query.order("transaction_date", desc=True).order("id", desc=True)

        # Pagination using zero-based range indices
        query = query.range(offset, offset + limit - 1)

        response = query.execute()
        rows = response.data or []

        target_curr = (display_currency or "").strip().upper()
        if target_curr:
            for row in rows:
                orig_amount = row.get("amount", 0)
                orig_curr = row.get("currency", "INR")
                tx_dt = str(row.get("transaction_date", ""))

                conv_amt, rate, is_conv = CurrencyService.convert_amount(
                    amount=orig_amount,
                    from_currency=orig_curr,
                    to_currency=target_curr,
                    transaction_date=tx_dt,
                    client=client,
                )
                row["converted_amount"] = float(conv_amt)
                row["display_currency"] = target_curr
                row["exchange_rate"] = float(rate)
                row["is_converted"] = is_conv
        else:
            for row in rows:
                row["converted_amount"] = float(row.get("amount", 0))
                row["display_currency"] = row.get("currency", "INR")
                row["exchange_rate"] = 1.0
                row["is_converted"] = False

        return rows
    except Exception as exc:
        logger.error(f"Error fetching transactions: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_format_db_error(exc, "Failed to retrieve transactions from database"),
        )


def get_transaction_by_id(
    client: Client, transaction_id: int, user_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Fetch a single transaction ensuring it belongs to the authenticated user."""
    try:
        query = client.table("transactions").select("*").eq("id", transaction_id)
        if user_id:
            query = query.eq("user_id", user_id)

        response = query.limit(1).execute()
        if not response.data:
            return None
        return response.data[0]
    except Exception as exc:
        logger.error(f"Error fetching transaction {transaction_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_format_db_error(exc, "Failed to retrieve transaction from database"),
        )


def update_transaction(
    client: Client,
    transaction_id: int,
    transaction_update: TransactionUpdate,
    user_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Update fields of an existing transaction belonging to the user."""
    update_data = transaction_update.model_dump(exclude_unset=True)

    if "amount" in update_data and update_data["amount"] is not None:
        update_data["amount"] = float(update_data["amount"])

    if "transaction_date" in update_data and update_data["transaction_date"] is not None:
        update_data["transaction_date"] = update_data["transaction_date"].isoformat()

    try:
        # Check ownership first
        existing = get_transaction_by_id(client, transaction_id, user_id=user_id)
        if not existing:
            return None

        query = client.table("transactions").update(update_data).eq("id", transaction_id)
        if user_id:
            query = query.eq("user_id", user_id)

        response = query.execute()
        if not response.data:
            return None
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error updating transaction {transaction_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_format_db_error(exc, "Failed to update transaction"),
        )


def delete_transaction(
    client: Client, transaction_id: int, user_id: Optional[str] = None
) -> bool:
    """Delete a transaction by ID ensuring user ownership."""
    try:
        existing = get_transaction_by_id(client, transaction_id, user_id=user_id)
        if not existing:
            return False

        query = client.table("transactions").delete().eq("id", transaction_id)
        if user_id:
            query = query.eq("user_id", user_id)

        query.execute()
        return True
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error deleting transaction {transaction_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_format_db_error(exc, "Failed to delete transaction"),
        )


def calculate_summary(
    client: Client, currency: str = "INR", user_id: Optional[str] = None
) -> FinancialSummary:
    """
    Calculate financial summary (Total Income, Total Expenses, Balance)
    converted to the requested display currency using historical exchange rates
    for each transaction's original date. Original database records are never modified.
    """
    normalized_currency = currency.strip().upper()
    try:
        query = (
            client.table("transactions")
            .select("type, amount, currency, transaction_date")
        )
        if user_id:
            query = query.eq("user_id", user_id)

        response = query.execute()

        records = response.data or []
        total_income = Decimal("0.00")
        total_expenses = Decimal("0.00")
        has_any_conversion = False

        for row in records:
            orig_amount = row.get("amount", 0)
            orig_currency = row.get("currency", "INR")
            tx_date = str(row.get("transaction_date", ""))

            converted_amount, _, was_converted = CurrencyService.convert_amount(
                amount=orig_amount,
                from_currency=orig_currency,
                to_currency=normalized_currency,
                transaction_date=tx_date,
                client=client,
            )

            if was_converted:
                has_any_conversion = True

            tx_type = row.get("type")
            if tx_type == "income":
                total_income += converted_amount
            elif tx_type == "expense":
                total_expenses += converted_amount

        balance = total_income - total_expenses

        return FinancialSummary(
            total_income=float(total_income),
            total_expenses=float(total_expenses),
            balance=float(balance),
            currency=normalized_currency,
            is_converted=has_any_conversion,
            transaction_count=len(records),
        )
    except Exception as exc:
        logger.error(f"Error calculating financial summary: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_format_db_error(exc, "Failed to compute financial summary from database"),
        )
