from __future__ import annotations

import uuid
from datetime import date
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expenses import Expense
from app.repositories.base import BaseRepository


class ExpenseRepository(BaseRepository[Expense]):
    """Repository for expense records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Expense)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        start_date: date | None = None,
        end_date: date | None = None,
        category_id: uuid.UUID | None = None,
        payment_method: str | None = None,
        is_recurring: bool | None = None,
    ) -> Sequence[Expense]:
        """List expense records for a user with optional filters."""
        query = (
            select(Expense)
            .where(Expense.user_id == user_id, Expense.deleted_at.is_(None))
            .order_by(Expense.expense_date.desc())
        )
        if start_date:
            query = query.where(Expense.expense_date >= start_date)
        if end_date:
            query = query.where(Expense.expense_date <= end_date)
        if category_id:
            query = query.where(Expense.category_id == category_id)
        if payment_method:
            query = query.where(Expense.payment_method == payment_method)
        if is_recurring is not None:
            query = query.where(Expense.is_recurring.is_(is_recurring))

        query = query.offset(skip).limit(limit)
        return (await self._session.execute(query)).scalars().all()

    async def sum_for_period(
        self,
        user_id: uuid.UUID,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> float:
        """Return total expenses for a user over a date range."""
        query = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.deleted_at.is_(None),
        )
        if start_date:
            query = query.where(Expense.expense_date >= start_date)
        if end_date:
            query = query.where(Expense.expense_date <= end_date)

        result = await self._session.execute(query)
        return result.scalar() or 0

    async def sum_by_category(
        self,
        user_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> Sequence[tuple[uuid.UUID, float]]:
        """Return total expenses grouped by category for a date range."""
        query = (
            select(Expense.category_id, func.coalesce(func.sum(Expense.amount), 0))
            .where(
                Expense.user_id == user_id,
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
                Expense.deleted_at.is_(None),
            )
            .group_by(Expense.category_id)
        )
        return (await self._session.execute(query)).all()  # type: ignore[return-value]
