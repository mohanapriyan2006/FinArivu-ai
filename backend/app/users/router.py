"""User API routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from core.logging import logger
from schemas.user import UserSyncRequest
from schemas.profile import ProfileResponse
from services.user_service import user_service
from services.profile_service import profile_service
from utils.response import success_response

router = APIRouter(tags=["Users"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_user(
    user_data: UserSyncRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Sync Clerk user into the database.

    Creates the user and an empty profile if they don't exist.
    Returns the user's profile.
    """
    logger.info("User sync request", extra={"user_id": str(current_user["user_id"])})

    user = await user_service.sync_user(
        session,
        user_id=current_user["user_id"],
        email=user_data.email or current_user.get("email", ""),
    )

    profile = await profile_service.get_profile(session, user.id)

    return success_response(
        data=ProfileResponse.model_validate(profile) if profile else None,
        message="User synced successfully",
    )
