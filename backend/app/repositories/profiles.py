from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import Profile
from app.repositories.base import BaseRepository


class ProfileRepository(BaseRepository[Profile]):
    """Repository for user profile persistence."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Profile)

    async def get_by_user_id(self, user_id: uuid.UUID) -> Profile | None:
        """Fetch a profile by user identifier."""
        query = select(Profile).where(
            Profile.user_id == user_id,
            Profile.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()
