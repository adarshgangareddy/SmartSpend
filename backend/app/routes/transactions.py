from datetime import date
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from supabase import Client
from app.auth import get_current_user
from app.database import get_supabase_client
from app.schemas.transaction import (
    DeleteResponse,
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new transaction",
    description="Record a new income or expense entry belonging to the authenticated user.",
)
def create_new_transaction(
    transaction_in: TransactionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Create a new income or expense transaction linked to user_id."""
    return transaction_service.create_transaction(
        client=client,
        transaction_in=transaction_in,
        user_id=current_user["id"],
    )


@router.get(
    "",
    response_model=List[TransactionResponse],
    status_code=status.HTTP_200_OK,
    summary="List transactions",
    description="Retrieve the authenticated user's transactions with optional filtering and pagination.",
)
def list_transactions(
    type: Optional[str] = Query(
        None,
        description="Filter by transaction type: 'income' or 'expense'",
    ),
    category: Optional[str] = Query(
        None,
        description="Filter by category substring match",
    ),
    start_date: Optional[date] = Query(
        None,
        description="Filter records on or after this date (YYYY-MM-DD)",
    ),
    end_date: Optional[date] = Query(
        None,
        description="Filter records on or before this date (YYYY-MM-DD)",
    ),
    limit: int = Query(
        100,
        ge=1,
        le=500,
        description="Maximum number of records to return",
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Offset for pagination",
    ),
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Retrieve transactions belonging strictly to the authenticated user."""
    if type is not None:
        type_clean = type.strip().lower()
        if type_clean not in ("income", "expense"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query parameter 'type' must be either 'income' or 'expense'.",
            )
        type = type_clean

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter 'start_date' cannot be later than 'end_date'.",
        )

    return transaction_service.get_transactions(
        client=client,
        user_id=current_user["id"],
        tx_type=type,
        category=category,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get transaction by ID",
    description="Fetch a single transaction ensuring user ownership.",
)
def get_single_transaction(
    transaction_id: int = Path(..., ge=1, description="Unique transaction ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Retrieve details of a single transaction owned by the user."""
    transaction = transaction_service.get_transaction_by_id(
        client=client,
        transaction_id=transaction_id,
        user_id=current_user["id"],
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found.",
        )
    return transaction


@router.put(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update transaction",
    description="Update existing transaction fields belonging to the user.",
)
def update_existing_transaction(
    transaction_update: TransactionUpdate,
    transaction_id: int = Path(..., ge=1, description="Unique transaction ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Update an existing transaction record owned by the authenticated user."""
    updated = transaction_service.update_transaction(
        client=client,
        transaction_id=transaction_id,
        transaction_update=transaction_update,
        user_id=current_user["id"],
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found.",
        )
    return updated


@router.delete(
    "/{transaction_id}",
    response_model=DeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete transaction",
    description="Permanently delete a transaction owned by the authenticated user.",
)
def delete_existing_transaction(
    transaction_id: int = Path(..., ge=1, description="Unique transaction ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    """Delete a transaction record owned by the user."""
    deleted = transaction_service.delete_transaction(
        client=client,
        transaction_id=transaction_id,
        user_id=current_user["id"],
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found.",
        )
    return DeleteResponse(
        message="Transaction deleted successfully",
        id=transaction_id,
    )
