from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.profiles import ProfileResponse, ProfileUpdate
from app.services.profiles import ProfileService
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def get_profile_service(session: AsyncSession = Depends(get_db_session)) -> ProfileService:
    return ProfileService(session)


@router.get("/me", response_model=dict, summary="Get current user profile")
async def get_my_profile(
    request: Request,
    service: ProfileService = Depends(get_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the profile for the authenticated user."""
    profile = await service.get_or_create_by_user(uuid.UUID(user_id))
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=ProfileResponse.model_validate(profile).model_dump(),
        message="Profile retrieved successfully",
    )


@router.put("/me", response_model=dict, summary="Update current user profile")
async def update_my_profile(
    data: ProfileUpdate,
    request: Request,
    service: ProfileService = Depends(get_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update or create the profile for the authenticated user."""
    profile = await service.update_by_user(uuid.UUID(user_id), data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=ProfileResponse.model_validate(profile).model_dump(),
        message="Profile updated successfully",
    )


@router.get("/{profile_id}", response_model=dict, summary="Get profile by ID")
async def get_profile(
    profile_id: uuid.UUID,
    request: Request,
    service: ProfileService = Depends(get_profile_service),
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a profile by ID; only the owner can access it."""
    profile = await service.get(profile_id)
    if str(profile.user_id) != current_user_id:
        return error_response(
            message="You can only view your own profile",
            error_code="AUTHORIZATION_ERROR",
        )
    request.state.user_id = uuid.UUID(current_user_id)
    return success_response(
        data=ProfileResponse.model_validate(profile).model_dump(),
        message="Profile retrieved successfully",
    )
