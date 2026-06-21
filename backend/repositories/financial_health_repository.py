"""Financial Health Score repository."""

import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.financial_health_score import FinancialHealthScore
from repositories.base import BaseRepository


class FinancialHealthScoreRepository(BaseRepository[FinancialHealthScore]):
    """Repository for financial health score operations."""

    def __init__(self) -> None:
        super().__init__(FinancialHealthScore)

    async def get_by_user_id(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[FinancialHealthScore]:
        """Get all health score records for a user, newest first."""
        result = await session.execute(
            select(FinancialHealthScore)
            .where(FinancialHealthScore.user_id == user_id)
            .order_by(desc(FinancialHealthScore.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_latest_by_user(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> FinancialHealthScore | None:
        """Get the most recent health score for a user."""
        result = await session.execute(
            select(FinancialHealthScore)
            .where(FinancialHealthScore.user_id == user_id)
            .order_by(desc(FinancialHealthScore.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()


financial_health_repository = FinancialHealthScoreRepository()
