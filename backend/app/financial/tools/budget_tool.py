from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.engines.budget_engine import BudgetEngine


async def get_budget_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    """Return a serialisable budget analysis for the user."""
    result = await BudgetEngine.analyze(session, user_id, year=year, month=month)
    return result.model_dump()
