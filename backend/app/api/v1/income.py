from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.income import IncomeCreate, IncomeFilter, IncomeListResponse, IncomeResponse, IncomeUpdate
from app.services.income import IncomeService
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/income", tags=["Income"])


def get_income_service(session: AsyncSession = Depends(get_db_session)) -> IncomeService:
    return IncomeService(session)


@router.get("", response_model=dict, summary="List income records")
async def list_income(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    source: str | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    is_recurring: bool | None = Query(None),
    service: IncomeService = Depends(get_income_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """List income records for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    items = await service.list_for_user(
        user_uuid,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        source=source,
        is_recurring=is_recurring,
    )
    request.state.user_id = user_uuid
    return success_response(
        data=IncomeListResponse(
            items=[IncomeResponse.model_validate(i).model_dump() for i in items],
            meta={"page": (skip // limit) + 1, "per_page": limit, "total": len(items), "pages": 1},
        ).model_dump(),
        message="Income records retrieved successfully",
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create income record")
async def create_income(
    request: Request,
    data: IncomeCreate,
    service: IncomeService = Depends(get_income_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Create a new income record."""
    user_uuid = uuid.UUID(user_id)
    income = await service.create_for_user(user_uuid, data)
    request.state.user_id = user_uuid
    return success_response(
        data=IncomeResponse.model_validate(income).model_dump(),
        message="Income created successfully",
    )


@router.get("/{income_id}", response_model=dict, summary="Get income by ID")
async def get_income(
    income_id: uuid.UUID,
    request: Request,
    service: IncomeService = Depends(get_income_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a single income record by ID."""
    income = await service.get(income_id)
    if income.user_id != uuid.UUID(user_id):
        return error_response(
            message="You can only access your own income records",
            error_code="AUTHORIZATION_ERROR",
        )
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=IncomeResponse.model_validate(income).model_dump(),
        message="Income retrieved successfully",
    )


@router.put("/{income_id}", response_model=dict, summary="Update income")
async def update_income(
    income_id: uuid.UUID,
    data: IncomeUpdate,
    request: Request,
    service: IncomeService = Depends(get_income_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update an income record."""
    income = await service.update_for_user(uuid.UUID(user_id), income_id, data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=IncomeResponse.model_validate(income).model_dump(),
        message="Income updated successfully",
    )


@router.delete("/{income_id}", response_model=dict, summary="Delete income")
async def delete_income(
    income_id: uuid.UUID,
    request: Request,
    service: IncomeService = Depends(get_income_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete an income record."""
    await service.delete_for_user(uuid.UUID(user_id), income_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(message="Income deleted successfully")
