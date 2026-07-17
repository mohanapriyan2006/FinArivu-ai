from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.exceptions import AuthorizationError
from app.schemas.budgets import BudgetCreate, BudgetListResponse, BudgetResponse, BudgetUpdate
from app.services.budgets import BudgetService
from app.utils.response import success_response

router = APIRouter(prefix="/budgets", tags=["Budgets"])


def get_budget_service(session: AsyncSession = Depends(get_db_session)) -> BudgetService:
    return BudgetService(session)


@router.get("", response_model=dict, summary="List budgets")
async def list_budgets(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service: BudgetService = Depends(get_budget_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """List budgets for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    items = await service.list_for_user(user_uuid, skip=skip, limit=limit)
    request.state.user_id = user_uuid
    return success_response(
        data=BudgetListResponse(
            items=[BudgetResponse.model_validate(b).model_dump() for b in items],
            meta={"page": (skip // limit) + 1, "per_page": limit, "total": len(items), "pages": 1},
        ).model_dump(),
        message="Budgets retrieved successfully",
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create budget")
async def create_budget(
    request: Request,
    data: BudgetCreate,
    service: BudgetService = Depends(get_budget_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Create a new budget."""
    user_uuid = uuid.UUID(user_id)
    budget = await service.create_for_user(user_uuid, data)
    request.state.user_id = user_uuid
    return success_response(
        data=BudgetResponse.model_validate(budget).model_dump(),
        message="Budget created successfully",
    )


@router.get("/{budget_id}", response_model=dict, summary="Get budget by ID")
async def get_budget(
    budget_id: uuid.UUID,
    request: Request,
    service: BudgetService = Depends(get_budget_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a budget by ID."""
    budget = await service.get(budget_id)
    if budget.user_id != uuid.UUID(user_id):
        raise AuthorizationError("You can only access your own budgets")
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=BudgetResponse.model_validate(budget).model_dump(),
        message="Budget retrieved successfully",
    )


@router.put("/{budget_id}", response_model=dict, summary="Update budget")
async def update_budget(
    budget_id: uuid.UUID,
    data: BudgetUpdate,
    request: Request,
    service: BudgetService = Depends(get_budget_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update a budget."""
    budget = await service.update_for_user(uuid.UUID(user_id), budget_id, data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=BudgetResponse.model_validate(budget).model_dump(),
        message="Budget updated successfully",
    )


@router.delete("/{budget_id}", response_model=dict, summary="Delete budget")
async def delete_budget(
    budget_id: uuid.UUID,
    request: Request,
    service: BudgetService = Depends(get_budget_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete a budget."""
    await service.delete_for_user(uuid.UUID(user_id), budget_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(message="Budget deleted successfully")
