from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.schemas import FinancialHealthResult
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
    ) -> FinancialHealthResult:
        svc = FinancialService(session)
        result = await svc.calculate_health_score(user_id, year=year, month=month)
        return FinancialHealthResult(**result.model_dump())
