"""Insight repository."""

import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.insight import Insight
from repositories.base import BaseRepository


class InsightRepository(BaseRepository[Insight]):
    """Repository for insight operations."""

    def __init__(self) -> None:
        super().__init__(Insight)

    async def get_by_user_id(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Insight]:
        """Get all insights for a user."""
        result = await session.execute(
            select(Insight)
            .where(Insight.user_id == user_id)
            .order_by(desc(Insight.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_unread_by_user(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> list[Insight]:
        """Get unread insights for a user."""
        result = await session.execute(
            select(Insight)
            .where(Insight.user_id == user_id, Insight.is_read == False)
            .order_by(desc(Insight.created_at))
        )
        return list(result.scalars().all())

    async def get_by_id_with_owner(
        self,
        session: AsyncSession,
        insight_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Insight | None:
        """Get an insight by ID ensuring it belongs to the user."""
        result = await session.execute(
            select(Insight).where(
                Insight.id == insight_id,
                Insight.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def mark_all_read(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> int:
        """Mark all insights as read for a user."""
        result = await session.execute(
            select(Insight).where(
                Insight.user_id == user_id,
                Insight.is_read == False,
            )
        )
        items = result.scalars().all()
        for item in items:
            item.is_read = True
        return len(items)


insight_repository = InsightRepository()
