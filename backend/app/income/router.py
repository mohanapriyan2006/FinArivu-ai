"""Income API routes."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from schemas.income import IncomeCreate, IncomeResponse, IncomeUpdate
from services.income_service import income_service
from services.user_service import user_service
from utils.response import success_response

router = APIRouter(tags=["Income"])


@router.get("/income", response_model=List[IncomeResponse], status_code=status.HTTP_200_OK)
async def list_income(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all income entries for the current user."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    items = await income_service.get_user_income(session, user.id, skip, limit)
    return [IncomeResponse.model_validate(item) for item in items]


@router.post("/income", status_code=status.HTTP_201_CREATED)
async def create_income(
    data: IncomeCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a new income entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await income_service.create_income(session, user.id, data)
    return success_response(
        data=IncomeResponse.model_validate(item),
        message="Income created successfully",
    )


@router.put("/income/{income_id}", status_code=status.HTTP_200_OK)
async def update_income(
    income_id: uuid.UUID,
    data: IncomeUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Update an existing income entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await income_service.update_income(session, income_id, user.id, data)
    return success_response(
        data=IncomeResponse.model_validate(item),
        message="Income updated successfully",
    )


@router.delete("/income/{income_id}", status_code=status.HTTP_200_OK)
async def delete_income(
    income_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete an income entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    await income_service.delete_income(session, income_id, user.id)
    return success_response(message="Income deleted successfully")
