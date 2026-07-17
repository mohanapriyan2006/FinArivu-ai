from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.exceptions import AuthorizationError
from app.schemas.liabilities import (
    LiabilityCreate,
    LiabilityListResponse,
    LiabilityResponse,
    LiabilityUpdate,
)
from app.services.liabilities import LiabilityService
from app.utils.response import success_response

router = APIRouter(prefix="/liabilities", tags=["Liabilities"])


def get_liability_service(session: AsyncSession = Depends(get_db_session)) -> LiabilityService:
    return LiabilityService(session)


@router.get("", response_model=dict, summary="List liabilities")
async def list_liabilities(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    liability_type: str | None = Query(None),
    service: LiabilityService = Depends(get_liability_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """List liabilities for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    items = await service.list_for_user(user_uuid, skip=skip, limit=limit, liability_type=liability_type)
    request.state.user_id = user_uuid
    return success_response(
        data=LiabilityListResponse(
            items=[LiabilityResponse.model_validate(l).model_dump() for l in items],
            meta={"page": (skip // limit) + 1, "per_page": limit, "total": len(items), "pages": 1},
        ).model_dump(),
        message="Liabilities retrieved successfully",
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create liability")
async def create_liability(
    request: Request,
    data: LiabilityCreate,
    service: LiabilityService = Depends(get_liability_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Create a liability."""
    user_uuid = uuid.UUID(user_id)
    liability = await service.create_for_user(user_uuid, data)
    request.state.user_id = user_uuid
    return success_response(
        data=LiabilityResponse.model_validate(liability).model_dump(),
        message="Liability created successfully",
    )


@router.get("/{liability_id}", response_model=dict, summary="Get liability by ID")
async def get_liability(
    liability_id: uuid.UUID,
    request: Request,
    service: LiabilityService = Depends(get_liability_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a liability by ID."""
    liability = await service.get(liability_id)
    if liability.user_id != uuid.UUID(user_id):
        raise AuthorizationError("You can only access your own liabilities")
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=LiabilityResponse.model_validate(liability).model_dump(),
        message="Liability retrieved successfully",
    )


@router.put("/{liability_id}", response_model=dict, summary="Update liability")
async def update_liability(
    liability_id: uuid.UUID,
    data: LiabilityUpdate,
    request: Request,
    service: LiabilityService = Depends(get_liability_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update a liability."""
    liability = await service.update_for_user(uuid.UUID(user_id), liability_id, data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=LiabilityResponse.model_validate(liability).model_dump(),
        message="Liability updated successfully",
    )


@router.delete("/{liability_id}", response_model=dict, summary="Delete liability")
async def delete_liability(
    liability_id: uuid.UUID,
    request: Request,
    service: LiabilityService = Depends(get_liability_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete a liability."""
    await service.delete_for_user(uuid.UUID(user_id), liability_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(message="Liability deleted successfully")
