"""Profile service layer."""

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from models.profile import Profile
from repositories.profile_repository import profile_repository
from schemas.profile import ProfileUpdate
from utils.exceptions import ResourceNotFoundError, DatabaseError


class ProfileService:
    """Service for profile operations."""

    async def get_profile(
        self,
        session: AsyncSession,
        user_id,
    ) -> Profile | None:
        """Get profile by user ID."""
        return await profile_repository.get_by_user_id(session, user_id)

    async def create_or_update_profile(
        self,
        session: AsyncSession,
        user_id,
        data: ProfileUpdate,
    ) -> Profile:
        """Create or update user profile."""
        try:
            profile = await profile_repository.get_by_user_id(session, user_id)

            update_data = data.model_dump(exclude_unset=True)

            if profile is None:
                logger.info("Creating profile", extra={"user_id": str(user_id)})
                update_data["user_id"] = str(user_id)
                profile = await profile_repository.create(session, update_data)
                await session.commit()
            else:
                logger.info("Updating profile", extra={"user_id": str(user_id)})
                profile = await profile_repository.update(
                    session, profile, update_data
                )
                await session.commit()

            return profile
        except Exception as exc:
            logger.error("Profile save failed", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to save profile") from exc


profile_service = ProfileService()
