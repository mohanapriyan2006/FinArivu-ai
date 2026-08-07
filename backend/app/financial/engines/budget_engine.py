from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.schemas import BudgetAnalysis
from app.services.financial import FinancialService


class BudgetEngine:
    """Deterministic budget analysis engine."""

    @staticmethod
    async def analyze(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        year: int | None = None,
        month: int | None = None,
    ) -> BudgetAnalysis:
        svc = FinancialService(session)
        result = await svc.analyze_budget(user_id, year=year, month=month)
        return BudgetAnalysis(**result.model_dump())
