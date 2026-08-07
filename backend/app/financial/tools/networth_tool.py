from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.networth_engine import NetWorthEngine


async def get_networth_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict:
    """Return a serialisable net worth analysis for the user."""
    result = await NetWorthEngine.calculate(session, user_id)
    return result.model_dump()
