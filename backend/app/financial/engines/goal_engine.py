from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.schemas import GoalAnalysis
from app.services.financial import FinancialService


class GoalEngine:
    """Deterministic goal planning and projection engine."""

    @staticmethod
    async def analyze(
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> GoalAnalysis:
        svc = FinancialService(session)
        result = await svc.project_goals(user_id)
        return GoalAnalysis(**result.model_dump())
