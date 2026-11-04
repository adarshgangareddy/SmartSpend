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

logger = logging.getLogger(__name__)


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
            detail="Failed to create transaction due to a database error.",
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
) -> List[Dict[str, Any]]:
    """Retrieve transactions filtered strictly by the authenticated user's ID."""
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
        return response.data or []
    except Exception as exc:
        logger.error(f"Error fetching transactions: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transactions from database.",
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
            detail="Failed to retrieve transaction from database.",
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
            detail="Failed to update transaction due to a database error.",
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
            detail="Failed to delete transaction due to a database error.",
        )


def calculate_summary(
    client: Client, currency: str = "INR", user_id: Optional[str] = None
) -> FinancialSummary:
    """
    Calculate financial summary (Total Income, Total Expenses, Balance)
    for a specific currency belonging to the authenticated user.
    """
    normalized_currency = currency.strip().upper()
    try:
        query = (
            client.table("transactions")
            .select("type, amount")
            .eq("currency", normalized_currency)
        )
        if user_id:
            query = query.eq("user_id", user_id)

        response = query.execute()

        records = response.data or []
        total_income = Decimal("0.00")
        total_expenses = Decimal("0.00")

        for row in records:
            amount_val = Decimal(str(row.get("amount", 0)))
            tx_type = row.get("type")
            if tx_type == "income":
                total_income += amount_val
            elif tx_type == "expense":
                total_expenses += amount_val

        balance = total_income - total_expenses

        return FinancialSummary(
            total_income=float(total_income),
            total_expenses=float(total_expenses),
            balance=float(balance),
            currency=normalized_currency,
        )
    except Exception as exc:
        logger.error(f"Error calculating financial summary: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute financial summary from database.",
        )
