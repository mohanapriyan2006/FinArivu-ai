from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user persistence."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, User)

    async def get_by_external_id(self, external_id: str) -> User | None:
        """Fetch a user by their external identity provider identifier."""
        query = select(User).where(
            User.clerk_id == external_id,
            User.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Fetch a user by email address."""
        query = select(User).where(
            User.email == email.lower(),
            User.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def get_by_id(self, id: uuid.UUID, include_deleted: bool = False) -> User | None:
        """Fetch a user by primary key."""
        return await super().get_by_id(id, include_deleted=include_deleted)
