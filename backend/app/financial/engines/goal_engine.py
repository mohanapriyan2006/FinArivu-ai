from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.financial import GoalProjectionsResponse
from app.services.financial import FinancialService


class GoalEngine:
    """Deterministic goal planning and projection engine."""

    @staticmethod
    async def analyze(
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> GoalProjectionsResponse:
        svc = FinancialService(session)
        return await svc.project_goals(user_id)
