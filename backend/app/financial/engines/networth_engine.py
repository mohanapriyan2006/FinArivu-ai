from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.schemas import NetWorthAnalysis
from app.services.financial import FinancialService


class NetWorthEngine:
    """Deterministic net worth analysis engine."""

    @staticmethod
    async def calculate(
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> NetWorthAnalysis:
        svc = FinancialService(session)
        result = await svc.calculate_net_worth(user_id)
        return NetWorthAnalysis(**result.model_dump())
