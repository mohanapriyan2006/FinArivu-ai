from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budgets import Budget
from app.repositories.base import BaseRepository


class BudgetRepository(BaseRepository[Budget]):
    """Repository for budget records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Budget)

    async def get_by_user_and_category(
        self,
        user_id: uuid.UUID,
        category_id: uuid.UUID,
    ) -> Budget | None:
        """Fetch a budget by user and category."""
        query = (
            select(Budget)
            .where(
                Budget.user_id == user_id,
                Budget.category_id == category_id,
                Budget.deleted_at.is_(None),
            )
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Budget]:
        """List budgets for a user."""
        query = (
            select(Budget)
            .where(Budget.user_id == user_id, Budget.deleted_at.is_(None))
            .order_by(Budget.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list((await self._session.execute(query)).scalars().all())
