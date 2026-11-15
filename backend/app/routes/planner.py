import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.auth import get_current_user
from app.database import get_supabase_client
from app.schemas.planner import (
    ConvertPlannedItemRequest,
    PlannedItemCreate,
    PlannedItemResponse,
    PlannedItemUpdate,
)
from app.schemas.transaction import TransactionCreate
from app.services import transaction_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/planner", tags=["Smart Planner"])


def _handle_missing_table(exc: Exception):
    err_msg = str(exc)
    if "PGRST205" in err_msg or "planned_items" in err_msg.lower():
        return True
    return False


@router.get(
    "",
    response_model=List[PlannedItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List planned upcoming purchases",
    description="Retrieve all planned purchase items for the authenticated user, optionally filtered by status, urgency, or event.",
)
def list_planned_items(
    urgency: Optional[str] = Query(None, description="Filter by urgency: immediate, upcoming, or long_term"),
    item_status: Optional[str] = Query(None, alias="status", description="Filter by status: pending, bought, or archived"),
    event_tag: Optional[str] = Query(None, description="Filter by event tag (e.g. 'College Prep')"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    user_id = current_user["id"]
    try:
        query = client.table("planned_items").select("*").eq("user_id", user_id)

        if urgency:
            query = query.eq("urgency", urgency.lower())
        if item_status:
            query = query.eq("status", item_status.lower())
        if event_tag:
            query = query.ilike("event_tag", f"%{event_tag}%")

        # Order by urgency (immediate first), then target date ascending, then created_at desc
        query = query.order("target_date", desc=False, nulls_first=False).order("created_at", desc=True)

        res = query.execute()
        return res.data or []
    except Exception as exc:
        if _handle_missing_table(exc):
            logger.warning("Table 'planned_items' does not exist yet in Supabase.")
            return []
        logger.error("Error listing planned items: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve planned items from database.",
        )


@router.post(
    "",
    response_model=PlannedItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a planned purchase item",
    description="Add a new item to buy (immediate essential, upcoming college expense, long-term travel goal).",
)
def create_planned_item(
    item_in: PlannedItemCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    user_id = current_user["id"]
    payload = item_in.model_dump()
    payload["user_id"] = user_id
    payload["estimated_amount"] = float(item_in.estimated_amount)
    if item_in.target_date:
        payload["target_date"] = item_in.target_date.isoformat()

    try:
        res = client.table("planned_items").insert(payload).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database failed to persist planned item.",
            )
        return res.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        if _handle_missing_table(exc):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The 'planned_items' table has not been created yet in Supabase. Please run the migration script in docs/schema.sql.",
            )
        logger.error("Error creating planned item: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create planned item: {exc}",
        )


@router.put(
    "/{item_id}",
    response_model=PlannedItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a planned purchase item",
)
def update_planned_item(
    item_id: int,
    item_update: PlannedItemUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    user_id = current_user["id"]
    update_data = item_update.model_dump(exclude_unset=True)

    if "estimated_amount" in update_data and update_data["estimated_amount"] is not None:
        update_data["estimated_amount"] = float(update_data["estimated_amount"])
    if "target_date" in update_data and update_data["target_date"] is not None:
        update_data["target_date"] = update_data["target_date"].isoformat()

    update_data["updated_at"] = datetime.utcnow().isoformat()

    try:
        res = (
            client.table("planned_items")
            .update(update_data)
            .eq("id", item_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Planned item not found.",
            )
        return res.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error updating planned item %s: %s", item_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update planned item.",
        )


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a planned purchase item",
)
def delete_planned_item(
    item_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    user_id = current_user["id"]
    try:
        res = (
            client.table("planned_items")
            .delete()
            .eq("id", item_id)
            .eq("user_id", user_id)
            .execute()
        )
        return {"message": "Planned item deleted successfully", "id": item_id}
    except Exception as exc:
        logger.error("Error deleting planned item %s: %s", item_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete planned item.",
        )


@router.post(
    "/{item_id}/convert",
    status_code=status.HTTP_201_CREATED,
    summary="Convert planned item into an actual expense transaction",
    description="Marks item as 'bought' and creates an expense record in transactions with amount, category, date, and notes.",
)
def convert_planned_item_to_expense(
    item_id: int,
    convert_req: ConvertPlannedItemRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_supabase_client),
):
    user_id = current_user["id"]
    try:
        # 1. Fetch the existing planned item
        existing_res = (
            client.table("planned_items")
            .select("*")
            .eq("id", item_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if not existing_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Planned item not found.",
            )

        item = existing_res.data[0]
        final_amount = convert_req.actual_amount or item.get("estimated_amount", 0.0)
        final_date = convert_req.transaction_date or date.today()
        final_desc = convert_req.description or f"Purchased: {item.get('title')}"
        if item.get("event_tag"):
            final_desc += f" ({item.get('event_tag')})"

        # 2. Create the real transaction
        tx_in = TransactionCreate(
            type="expense",
            amount=final_amount,
            category=item.get("category", "Shopping"),
            currency=item.get("currency", "INR"),
            transaction_date=final_date,
            description=final_desc,
        )

        new_tx = transaction_service.create_transaction(
            client=client,
            transaction_in=tx_in,
            user_id=user_id,
        )

        # 3. Update the planned item status to 'bought' and link transaction
        updated_item = (
            client.table("planned_items")
            .update({
                "status": "bought",
                "converted_transaction_id": new_tx["id"],
                "updated_at": datetime.utcnow().isoformat(),
            })
            .eq("id", item_id)
            .eq("user_id", user_id)
            .execute()
        )

        return {
            "message": "Item converted to transaction successfully",
            "transaction": new_tx,
            "planned_item": updated_item.data[0] if updated_item.data else item,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error converting planned item %s to transaction: %s", item_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to convert item to transaction: {exc}",
        )

