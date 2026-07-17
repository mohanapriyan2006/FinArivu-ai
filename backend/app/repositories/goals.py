from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goals import Goal
from app.repositories.base import BaseRepository


class GoalRepository(BaseRepository[Goal]):
    """Repository for financial goals."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Goal)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
    ) -> list[Goal]:
        """List goals for a user."""
        query = select(Goal).where(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None),
        )
        if status:
            query = query.where(Goal.status == status)
        query = query.order_by(Goal.created_at.desc()).offset(skip).limit(limit)
        return list((await self._session.execute(query)).scalars().all())
