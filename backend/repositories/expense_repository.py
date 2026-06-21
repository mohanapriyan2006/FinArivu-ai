"""Expense repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from models.expense import Expense
from repositories.base import BaseRepository


class ExpenseRepository(BaseRepository[Expense]):
    """Repository for expense operations."""

    def __init__(self) -> None:
        super().__init__(Expense)

    async def get_by_user_id(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Expense]:
        """Get all expense records for a user."""
        result = await session.execute(
            select(Expense)
            .where(Expense.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


expense_repository = ExpenseRepository()
