from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.goal_engine import GoalEngine


async def get_goal_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict:
    """Return a serialisable goal analysis for the user."""
    result = await GoalEngine.analyze(session, user_id)
    return result.model_dump()
