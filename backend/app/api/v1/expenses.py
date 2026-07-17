from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.exceptions import AuthorizationError
from app.schemas.expenses import (
    ExpenseCreate,
    ExpenseFilter,
    ExpenseListResponse,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.services.expenses import ExpenseService
from app.utils.response import success_response

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def get_expense_service(session: AsyncSession = Depends(get_db_session)) -> ExpenseService:
    return ExpenseService(session)


@router.get("", response_model=dict, summary="List expense records")
async def list_expenses(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: uuid.UUID | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    payment_method: str | None = Query(None),
    is_recurring: bool | None = Query(None),
    service: ExpenseService = Depends(get_expense_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """List expenses for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    items = await service.list_for_user(
        user_uuid,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        payment_method=payment_method,
        is_recurring=is_recurring,
    )
    request.state.user_id = user_uuid
    return success_response(
        data=ExpenseListResponse(
            items=[ExpenseResponse.model_validate(e).model_dump() for e in items],
            meta={"page": (skip // limit) + 1, "per_page": limit, "total": len(items), "pages": 1},
        ).model_dump(),
        message="Expenses retrieved successfully",
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create expense record")
async def create_expense(
    request: Request,
    data: ExpenseCreate,
    service: ExpenseService = Depends(get_expense_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Create a new expense record."""
    user_uuid = uuid.UUID(user_id)
    expense = await service.create_for_user(user_uuid, data)
    request.state.user_id = user_uuid
    return success_response(
        data=ExpenseResponse.model_validate(expense).model_dump(),
        message="Expense created successfully",
    )


@router.get("/{expense_id}", response_model=dict, summary="Get expense by ID")
async def get_expense(
    expense_id: uuid.UUID,
    request: Request,
    service: ExpenseService = Depends(get_expense_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a single expense by ID."""
    expense = await service.get(expense_id)
    if expense.user_id != uuid.UUID(user_id):
        raise AuthorizationError("You can only access your own expense records")
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=ExpenseResponse.model_validate(expense).model_dump(),
        message="Expense retrieved successfully",
    )


@router.put("/{expense_id}", response_model=dict, summary="Update expense")
async def update_expense(
    expense_id: uuid.UUID,
    data: ExpenseUpdate,
    request: Request,
    service: ExpenseService = Depends(get_expense_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update an expense record."""
    expense = await service.update_for_user(uuid.UUID(user_id), expense_id, data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=ExpenseResponse.model_validate(expense).model_dump(),
        message="Expense updated successfully",
    )


@router.delete("/{expense_id}", response_model=dict, summary="Delete expense")
async def delete_expense(
    expense_id: uuid.UUID,
    request: Request,
    service: ExpenseService = Depends(get_expense_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete an expense record."""
    await service.delete_for_user(uuid.UUID(user_id), expense_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(message="Expense deleted successfully")
