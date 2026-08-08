from __future__ import annotations

import uuid
from datetime import date
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.income import Income
from app.repositories.base import BaseRepository


class IncomeRepository(BaseRepository[Income]):
    """Repository for income records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Income)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        start_date: date | None = None,
        end_date: date | None = None,
        source: str | None = None,
        is_recurring: bool | None = None,
    ) -> Sequence[Income]:
        """List income records for a user with optional filters."""
        query = (
            select(Income)
            .where(Income.user_id == user_id, Income.deleted_at.is_(None))
            .order_by(Income.income_date.desc())
        )
        if start_date:
            query = query.where(Income.income_date >= start_date)
        if end_date:
            query = query.where(Income.income_date <= end_date)
        if source:
            query = query.where(Income.source == source)
        if is_recurring is not None:
            query = query.where(Income.is_recurring.is_(is_recurring))

        query = query.offset(skip).limit(limit)
        return (await self._session.execute(query)).scalars().all()

    async def get_primary_by_user(self, user_id: uuid.UUID) -> Income | None:
        """Return the user's primary income record if one exists."""
        query = (
            select(Income)
            .where(
                Income.user_id == user_id,
                Income.is_primary.is_(True),
                Income.deleted_at.is_(None),
            )
            .order_by(Income.created_at.desc())
            .limit(1)
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def sum_for_period(
        self,
        user_id: uuid.UUID,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> float:
        """Return the sum of income for a user over a date range."""
        query = select(func.coalesce(func.sum(Income.amount), 0)).where(
            Income.user_id == user_id,
            Income.deleted_at.is_(None),
        )
        if start_date:
            query = query.where(Income.income_date >= start_date)
        if end_date:
            query = query.where(Income.income_date <= end_date)

        result = await self._session.execute(query)
        return result.scalar() or 0
