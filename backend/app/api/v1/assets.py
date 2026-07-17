from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.assets import AssetCreate, AssetListResponse, AssetResponse, AssetUpdate
from app.services.assets import AssetService
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/assets", tags=["Assets"])


def get_asset_service(session: AsyncSession = Depends(get_db_session)) -> AssetService:
    return AssetService(session)


@router.get("", response_model=dict, summary="List assets")
async def list_assets(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    asset_type: str | None = Query(None),
    service: AssetService = Depends(get_asset_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """List assets for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    items = await service.list_for_user(user_uuid, skip=skip, limit=limit, asset_type=asset_type)
    request.state.user_id = user_uuid
    return success_response(
        data=AssetListResponse(
            items=[AssetResponse.model_validate(a).model_dump() for a in items],
            meta={"page": (skip // limit) + 1, "per_page": limit, "total": len(items), "pages": 1},
        ).model_dump(),
        message="Assets retrieved successfully",
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create asset")
async def create_asset(
    request: Request,
    data: AssetCreate,
    service: AssetService = Depends(get_asset_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Create an asset."""
    user_uuid = uuid.UUID(user_id)
    asset = await service.create_for_user(user_uuid, data)
    request.state.user_id = user_uuid
    return success_response(
        data=AssetResponse.model_validate(asset).model_dump(),
        message="Asset created successfully",
    )


@router.get("/{asset_id}", response_model=dict, summary="Get asset by ID")
async def get_asset(
    asset_id: uuid.UUID,
    request: Request,
    service: AssetService = Depends(get_asset_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch an asset by ID."""
    asset = await service.get(asset_id)
    if asset.user_id != uuid.UUID(user_id):
        return error_response(
            message="You can only access your own assets",
            error_code="AUTHORIZATION_ERROR",
        )
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=AssetResponse.model_validate(asset).model_dump(),
        message="Asset retrieved successfully",
    )


@router.put("/{asset_id}", response_model=dict, summary="Update asset")
async def update_asset(
    asset_id: uuid.UUID,
    data: AssetUpdate,
    request: Request,
    service: AssetService = Depends(get_asset_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update an asset."""
    asset = await service.update_for_user(uuid.UUID(user_id), asset_id, data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=AssetResponse.model_validate(asset).model_dump(),
        message="Asset updated successfully",
    )


@router.delete("/{asset_id}", response_model=dict, summary="Delete asset")
async def delete_asset(
    asset_id: uuid.UUID,
    request: Request,
    service: AssetService = Depends(get_asset_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete an asset."""
    await service.delete_for_user(uuid.UUID(user_id), asset_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(message="Asset deleted successfully")
