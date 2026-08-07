from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.tax_engine import Deductions
from app.financial.engines.tax_engine import TaxEngine


async def get_tax_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    deductions: Deductions | None = None,
) -> dict:
    """Return a serialisable tax analysis for the user."""
    result = await TaxEngine.analyze(session, user_id, deductions=deductions)
    return result.model_dump()
