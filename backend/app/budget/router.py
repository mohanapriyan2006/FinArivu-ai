"""Budget API routes."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from core.security import limiter
from schemas.budget import (
    BudgetAnalysisResponse,
    BudgetCreate,
    BudgetResponse,
    BudgetUpdate,
)
from services.budget_service import budget_service
from services.user_service import user_service
from utils.response import success_response

router = APIRouter(tags=["Budgets"])


@router.get("/budgets", response_model=List[BudgetResponse], status_code=status.HTTP_200_OK)
async def list_budgets(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all budget entries for the current user."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    items = await budget_service.get_user_budgets(session, user.id, skip, limit)
    return [BudgetResponse.model_validate(item) for item in items]


@router.post("/budgets", status_code=status.HTTP_201_CREATED)
async def create_budget(
    data: BudgetCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a new budget entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await budget_service.create_budget(session, user.id, data)
    return success_response(
        data=BudgetResponse.model_validate(item),
        message="Budget created successfully",
    )


@router.put("/budgets/{budget_id}", status_code=status.HTTP_200_OK)
async def update_budget(
    budget_id: uuid.UUID,
    data: BudgetUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Update an existing budget entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await budget_service.update_budget(session, budget_id, user.id, data)
    return success_response(
        data=BudgetResponse.model_validate(item),
        message="Budget updated successfully",
    )


@router.delete("/budgets/{budget_id}", status_code=status.HTTP_200_OK)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a budget entry."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    await budget_service.delete_budget(session, budget_id, user.id)
    return success_response(message="Budget deleted successfully")


@router.get("/budgets/analysis", response_model=BudgetAnalysisResponse, status_code=status.HTTP_200_OK)
async def get_budget_analysis(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get budget analysis with spending vs limits."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    analysis = await budget_service.get_budget_analysis(session, user.id)
    return success_response(
        data=analysis,
        message="Budget analysis retrieved",
    )
