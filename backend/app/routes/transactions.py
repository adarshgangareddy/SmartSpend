from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from supabase import Client
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
    description="Record a new income or expense entry.",
)
def create_new_transaction(
    transaction_in: TransactionCreate,
    client: Client = Depends(get_supabase_client),
):
    """Create a new income or expense transaction."""
    return transaction_service.create_transaction(client, transaction_in)


@router.get(
    "",
    response_model=List[TransactionResponse],
    status_code=status.HTTP_200_OK,
    summary="List transactions",
    description="Retrieve transactions sorted by date descending with optional filtering and pagination.",
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
    client: Client = Depends(get_supabase_client),
):
    """Retrieve transactions with validation for date ranges and query parameters."""
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
    description="Fetch a single transaction using its unique identifier.",
)
def get_single_transaction(
    transaction_id: int = Path(..., ge=1, description="Unique transaction ID"),
    client: Client = Depends(get_supabase_client),
):
    """Retrieve details of a single transaction."""
    transaction = transaction_service.get_transaction_by_id(client, transaction_id)
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
    description="Update existing transaction fields. Rejects empty payloads.",
)
def update_existing_transaction(
    transaction_update: TransactionUpdate,
    transaction_id: int = Path(..., ge=1, description="Unique transaction ID"),
    client: Client = Depends(get_supabase_client),
):
    """Update an existing transaction record."""
    updated = transaction_service.update_transaction(
        client=client,
        transaction_id=transaction_id,
        transaction_update=transaction_update,
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
    description="Permanently delete a transaction by its ID.",
)
def delete_existing_transaction(
    transaction_id: int = Path(..., ge=1, description="Unique transaction ID"),
    client: Client = Depends(get_supabase_client),
):
    """Delete a transaction record."""
    deleted = transaction_service.delete_transaction(client, transaction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found.",
        )
    return DeleteResponse(
        message="Transaction deleted successfully",
        id=transaction_id,
    )

