from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.financial import NetWorthResponse
from app.services.financial import FinancialService


class NetWorthEngine:
    """Deterministic net worth analysis engine."""

    @staticmethod
    async def calculate(
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> NetWorthResponse:
        svc = FinancialService(session)
        return await svc.calculate_net_worth(user_id)
