"""Async wrappers around the existing deterministic financial engines.

Each function accepts a ``FinancialService`` (or raw engine inputs) and
returns a plain ``dict`` that agents embed in their ``AgentResult.data``.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.financial import FinancialService


async def get_budget_analysis(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    year: int | None = None,
    month: int | None = None,
) -> dict[str, Any]:
    """Run the budget engine and return serialisable results."""
    svc = FinancialService(session)
    result = await svc.analyze_budget(user_id, year=year, month=month)
    return result.model_dump()


async def get_health_score(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    year: int | None = None,
    month: int | None = None,
) -> dict[str, Any]:
    """Run the health-score engine and return serialisable results."""
    svc = FinancialService(session)
    result = await svc.calculate_health_score(user_id, year=year, month=month)
    return result.model_dump()


async def get_net_worth(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    """Run the net-worth engine and return serialisable results."""
    svc = FinancialService(session)
    result = await svc.calculate_net_worth(user_id)
    return result.model_dump()


async def get_goal_projections(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    """Run the goal engine and return serialisable results."""
    svc = FinancialService(session)
    result = await svc.project_goals(user_id)
    return result.model_dump()


async def get_tax_comparison(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    """Compute tax under both regimes using the user's profile income.

    Falls back to a default ₹10,00,000 gross income if profile is missing.
    """
    from app.engines.tax_engine import Deductions, compare_regimes
    from app.repositories.profiles import ProfileRepository

    profile_repo = ProfileRepository(session)
    profile = await profile_repo.get_by_user_id(user_id)

    gross_income = Decimal(str(profile.monthly_income or 0)) * 12 if profile else Decimal("1000000")
    if gross_income <= 0:
        gross_income = Decimal("1000000")

    deductions = Deductions()  # defaults
    result = compare_regimes(gross_income, deductions)

    # Serialise dataclasses.
    def _serialise(obj: Any) -> Any:
        if hasattr(obj, "__dataclass_fields__"):
            return {k: _serialise(v) for k, v in obj.__dict__.items()}
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, list):
            return [_serialise(i) for i in obj]
        return obj

    return _serialise(result)


async def get_retirement_projection(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    """Project retirement corpus using the user's profile."""
    from app.repositories.profiles import ProfileRepository

    profile_repo = ProfileRepository(session)
    profile = await profile_repo.get_by_user_id(user_id)

    current_age = int(profile.age) if profile and profile.age else 30
    monthly_expenses = Decimal(str(profile.monthly_income or 50000)) * Decimal("0.6")

    result = FinancialService.project_retirement({
        "current_age": current_age,
        "retirement_age": 60,
        "monthly_expenses": monthly_expenses,
        "inflation_rate": Decimal("0.06"),
        "safe_withdrawal_rate": Decimal("0.04"),
    })
    return result.model_dump()
