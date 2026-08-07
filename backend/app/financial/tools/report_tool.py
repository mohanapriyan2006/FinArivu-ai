from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.report_engine import ReportEngine


async def get_report(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    period: str = "monthly",
) -> dict:
    """Return a serialisable financial report for the user."""
    result = await ReportEngine.generate(session, user_id, period=period)
    return result.model_dump()
