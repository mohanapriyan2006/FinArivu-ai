from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.health_engine import HealthEngine


async def get_health_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    """Return a serialisable financial health analysis for the user."""
    result = await HealthEngine.calculate(session, user_id, year=year, month=month)
    return result.model_dump()
