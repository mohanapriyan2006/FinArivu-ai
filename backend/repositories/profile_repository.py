"""Profile repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from models.profile import Profile
from repositories.base import BaseRepository


class ProfileRepository(BaseRepository[Profile]):
    """Repository for profile operations."""

    def __init__(self) -> None:
        super().__init__(Profile)

    async def get_by_user_id(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> Profile | None:
        """Get profile by user ID."""
        result = await session.execute(
            select(Profile).where(Profile.user_id == user_id)
        )
        return result.scalar_one_or_none()


profile_repository = ProfileRepository()
