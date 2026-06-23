"""Expense API routes."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from services.expense_service import expense_service
from services.user_service import user_service
from utils.response import success_response

router = APIRouter(tags=["Expenses"])


@router.get("/expenses", response_model=List[ExpenseResponse], status_code=status.HTTP_200_OK)
async def list_expenses(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all expense entries for the current user."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    items = await expense_service.get_user_expenses(session, user.id, skip, limit)
    return [ExpenseResponse.model_validate(item) for item in items]


@router.post("/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a new expense entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await expense_service.create_expense(session, user.id, data)
    return success_response(
        data=ExpenseResponse.model_validate(item),
        message="Expense created successfully",
    )


@router.put("/expenses/{expense_id}", status_code=status.HTTP_200_OK)
async def update_expense(
    expense_id: uuid.UUID,
    data: ExpenseUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Update an existing expense entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await expense_service.update_expense(session, expense_id, user.id, data)
    return success_response(
        data=ExpenseResponse.model_validate(item),
        message="Expense updated successfully",
    )


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_200_OK)
async def delete_expense(
    expense_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete an expense entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    await expense_service.delete_expense(session, expense_id, user.id)
    return success_response(message="Expense deleted successfully")
