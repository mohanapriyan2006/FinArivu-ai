"""Budget repository."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.budget import Budget
from repositories.base import BaseRepository


class BudgetRepository(BaseRepository[Budget]):
    """Repository for budget operations."""

    def __init__(self) -> None:
        super().__init__(Budget)

    async def get_by_user_id(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Budget]:
        """Get all budget records for a user."""
        result = await session.execute(
            select(Budget)
            .where(Budget.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_user_and_category(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        category_id: uuid.UUID,
    ) -> Budget | None:
        """Get a budget by user and category."""
        result = await session.execute(
            select(Budget).where(
                Budget.user_id == user_id,
                Budget.category_id == category_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id_with_owner(
        self,
        session: AsyncSession,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Budget | None:
        """Get a budget by ID ensuring it belongs to the user."""
        result = await session.execute(
            select(Budget).where(
                Budget.id == budget_id,
                Budget.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()


budget_repository = BudgetRepository()
