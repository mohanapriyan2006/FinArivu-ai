from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weekly_reports import WeeklyReport
from app.repositories.base import BaseRepository


class WeeklyReportRepository(BaseRepository[WeeklyReport]):
    """Repository for weekly report records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, WeeklyReport)

    async def get_latest_for_user(self, user_id: uuid.UUID) -> WeeklyReport | None:
        """Return the most recent report for a user."""
        query = (
            select(WeeklyReport)
            .where(
                WeeklyReport.user_id == user_id,
                WeeklyReport.deleted_at.is_(None),
            )
            .order_by(WeeklyReport.generated_at.desc())
            .limit(1)
        )
        return (await self._session.execute(query)).scalar_one_or_none()
