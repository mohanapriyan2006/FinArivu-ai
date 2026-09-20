from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.financial import BudgetAnalysisResponse
from app.services.financial import FinancialService


class BudgetEngine:
    """Deterministic budget analysis engine.

    Returns the canonical ``BudgetAnalysisResponse`` so tool payloads keep the
    same camelCase contract the agents and frontend cards consume.
    """

    @staticmethod
    async def analyze(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        year: int | None = None,
        month: int | None = None,
    ) -> BudgetAnalysisResponse:
        svc = FinancialService(session)
        return await svc.analyze_budget(user_id, year=year, month=month)
