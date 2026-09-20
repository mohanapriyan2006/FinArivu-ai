from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.financial import HealthScoreResponse
from app.services.financial import FinancialService


class HealthEngine:
    """Deterministic financial health score engine."""

    @staticmethod
    async def calculate(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        year: int | None = None,
        month: int | None = None,
    ) -> HealthScoreResponse:
        svc = FinancialService(session)
        return await svc.calculate_health_score(user_id, year=year, month=month)
