from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense_estimates import MonthlyExpenseEstimate
from app.repositories.base import BaseRepository


class MonthlyExpenseEstimateRepository(BaseRepository[MonthlyExpenseEstimate]):
    """Repository for monthly expense estimate records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, MonthlyExpenseEstimate)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        estimate_month: date | None = None,
    ) -> list[MonthlyExpenseEstimate]:
        """List estimates for a user, optionally for a month."""
        query = select(MonthlyExpenseEstimate).where(
            MonthlyExpenseEstimate.user_id == user_id,
            MonthlyExpenseEstimate.deleted_at.is_(None),
        )
        if estimate_month:
            query = query.where(MonthlyExpenseEstimate.estimate_month == estimate_month)
        return list((await self._session.execute(query)).scalars().all())

    async def get_total_for_user(self, user_id: uuid.UUID) -> float:
        """Return the user's latest total estimate (uncategorised row)."""
        query = (
            select(MonthlyExpenseEstimate)
            .where(
                MonthlyExpenseEstimate.user_id == user_id,
                MonthlyExpenseEstimate.deleted_at.is_(None),
                MonthlyExpenseEstimate.category_id.is_(None),
            )
            .order_by(MonthlyExpenseEstimate.estimate_month.desc())
            .limit(1)
        )
        result = (await self._session.execute(query)).scalar_one_or_none()
        return float(result.amount) if result else 0.0
