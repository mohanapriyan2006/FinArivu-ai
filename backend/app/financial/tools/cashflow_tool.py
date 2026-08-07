from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.cashflow_engine import CashFlowEngine


async def get_cash_flow_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict:
    """Return a serialisable cash-flow analysis for the user."""
    result = await CashFlowEngine.analyze(session, user_id)
    return result.model_dump()
