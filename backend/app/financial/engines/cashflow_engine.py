from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.schemas import CashFlowAnalysis
from app.repositories.expenses import ExpenseRepository
from app.repositories.income import IncomeRepository


class CashFlowEngine:
    """Deterministic cash-flow analysis engine."""

    @staticmethod
    async def analyze(
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> CashFlowAnalysis:
        income_repo = IncomeRepository(session)
        expense_repo = ExpenseRepository(session)

        income = await income_repo.list_for_user(user_id, limit=1000)
        expenses = await expense_repo.list_for_user(user_id, limit=1000)

        total_income = sum(float(getattr(i, "amount", 0) or 0) for i in income)
        total_expenses = sum(float(getattr(e, "amount", 0) or 0) for e in expenses)
        savings = total_income - total_expenses
        savings_rate = (savings / total_income) if total_income > 0 else 0
        burn_rate = total_expenses / max(len(expenses), 1)
        runway_months = (total_income / total_expenses) if total_expenses > 0 else 0

        # Build a simple monthly trend keyed by YYYY-MM.
        trend: dict[str, dict[str, Any]] = {}
        for i in income:
            key = _month_key(getattr(i, "date", None))
            if key:
                trend.setdefault(key, {"income": 0, "expenses": 0, "savings": 0})
                trend[key]["income"] += float(getattr(i, "amount", 0) or 0)
        for e in expenses:
            key = _month_key(getattr(e, "date", None))
            if key:
                trend.setdefault(key, {"income": 0, "expenses": 0, "savings": 0})
                trend[key]["expenses"] += float(getattr(e, "amount", 0) or 0)
        for key in trend:
            trend[key]["savings"] = trend[key]["income"] - trend[key]["expenses"]

        return CashFlowAnalysis(
            total_income=total_income,
            total_expenses=total_expenses,
            savings=savings,
            savings_rate=savings_rate,
            burn_rate=burn_rate,
            runway_months=runway_months,
            monthly_trend=[{"month": k, **v} for k, v in sorted(trend.items())],
        )


def _month_key(value: Any) -> str | None:
    if value is None:
        return None
    if hasattr(value, "year") and hasattr(value, "month"):
        return f"{value.year:04d}-{value.month:02d}"
    if isinstance(value, str):
        return value[:7]
    return None
