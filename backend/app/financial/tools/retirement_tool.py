from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.retirement_engine import RetirementEngine


async def get_retirement_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    retirement_age: int = 60,
) -> dict:
    """Return a serialisable retirement analysis for the user."""
    result = await RetirementEngine.project(session, user_id, retirement_age=retirement_age)
    return result.model_dump()
