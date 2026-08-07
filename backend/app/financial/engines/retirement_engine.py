from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.schemas import RetirementAnalysis
from app.repositories.profiles import ProfileRepository


class RetirementEngine:
    """Deterministic retirement projection engine."""

    @staticmethod
    async def project(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        retirement_age: int = 60,
        inflation_rate: float = 0.06,
        safe_withdrawal_rate: float = 0.04,
    ) -> RetirementAnalysis:
        profile_repo = ProfileRepository(session)
        profile = await profile_repo.get_by_user_id(user_id)

        current_age = int(profile.age) if profile and getattr(profile, "age", None) else 30
        monthly_income = Decimal(str(getattr(profile, "monthly_income", 50000) or 50000))
        monthly_expenses = monthly_income * Decimal("0.6")

        years_remaining = max(0, retirement_age - current_age)
        future_monthly_expense = float(monthly_expenses) * ((1 + inflation_rate) ** years_remaining)
        annual_expense = future_monthly_expense * 12
        required_corpus = annual_expense / safe_withdrawal_rate if safe_withdrawal_rate else 0
        current_gap = required_corpus  # Simplified; current corpus not yet loaded.
        monthly_investment_required = (
            (required_corpus * inflation_rate)
            / ((1 + inflation_rate) ** years_remaining - 1)
            / 12
            if years_remaining > 0 and inflation_rate > 0
            else required_corpus / max(years_remaining * 12, 1)
        )
        readiness_score = max(0.0, 1.0 - (current_gap / max(required_corpus, 1))) * 100

        return RetirementAnalysis(
            current_age=current_age,
            retirement_age=retirement_age,
            years_remaining=years_remaining,
            future_monthly_expense=future_monthly_expense,
            required_corpus=required_corpus,
            current_gap=current_gap,
            monthly_investment_required=monthly_investment_required,
            inflation_rate=inflation_rate,
            safe_withdrawal_rate=safe_withdrawal_rate,
            readiness_score=readiness_score,
        )
