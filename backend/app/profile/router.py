"""Profile API routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from core.logging import logger
from schemas.profile import ProfileResponse, ProfileUpdate
from services.profile_service import profile_service
from services.user_service import user_service
from utils.response import success_response

router = APIRouter(tags=["Profile"])


@router.get("/profile", status_code=status.HTTP_200_OK)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get the current user's profile."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    profile = await profile_service.get_profile(session, user.id)

    return success_response(
        data=ProfileResponse.model_validate(profile) if profile else None,
        message="Profile retrieved",
    )


@router.post("/profile", status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create or update the current user's profile."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )

    profile = await profile_service.create_or_update_profile(
        session, user.id, data
    )

    return success_response(
        data=ProfileResponse.model_validate(profile),
        message="Profile saved successfully",
    )


@router.put("/profile", status_code=status.HTTP_200_OK)
async def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )

    profile = await profile_service.create_or_update_profile(
        session, user.id, data
    )

    return success_response(
        data=ProfileResponse.model_validate(profile),
        message="Profile updated successfully",
    )
