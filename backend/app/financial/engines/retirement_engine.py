from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.retirement_engine import project_retirement
from app.exceptions import InsufficientDataError
from app.repositories.expense_estimates import MonthlyExpenseEstimateRepository
from app.repositories.expenses import ExpenseRepository
from app.repositories.profiles import ProfileRepository
from app.schemas.financial import RetirementResponse


class RetirementEngine:
    """Deterministic retirement projection engine.

    Delegates all math to ``app.engines.retirement_engine.project_retirement``
    and feeds it real user inputs (age, target retirement age, average monthly
    expenses). Missing inputs raise ``InsufficientDataError`` — no values are
    invented.
    """

    @staticmethod
    async def project(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        retirement_age: int = 60,
        inflation_rate: float = 0.06,
        safe_withdrawal_rate: float = 0.04,
    ) -> RetirementResponse:
        profile_repo = ProfileRepository(session)
        profile = await profile_repo.get_by_user_id(user_id)

        current_age: int | None = None
        if profile:
            if profile.age:
                current_age = int(profile.age)
            elif profile.date_of_birth:
                today = date.today()
                dob = profile.date_of_birth
                current_age = (
                    today.year - dob.year
                    - ((today.month, today.day) < (dob.month, dob.day))
                )
            if profile.retirement_age:
                retirement_age = int(profile.retirement_age)

        missing: list[str] = []
        if current_age is None:
            missing.append("current age")

        monthly_expenses = await RetirementEngine._average_monthly_expenses(
            session, user_id
        )
        if monthly_expenses is None or monthly_expenses <= 0:
            missing.append("monthly expenses")

        if missing:
            raise InsufficientDataError(
                "Retirement projection requires more profile information.",
                missing_fields=missing,
            )

        projection = project_retirement(
            current_age=int(current_age),
            retirement_age=retirement_age,
            monthly_expenses=Decimal(str(monthly_expenses)),
            inflation_rate=Decimal(str(inflation_rate)),
            safe_withdrawal_rate=Decimal(str(safe_withdrawal_rate)),
        )

        return RetirementResponse(
            current_age=projection.current_age,
            retirement_age=projection.retirement_age,
            years_to_retirement=projection.years_to_retirement,
            current_monthly_expenses=projection.current_monthly_expenses,
            inflation_rate=projection.inflation_rate,
            future_monthly_expenses=projection.future_monthly_expenses,
            future_annual_expenses=projection.future_annual_expenses,
            retirement_corpus=projection.retirement_corpus,
            safe_withdrawal_rate=projection.safe_withdrawal_rate,
            notes=projection.notes,
        )

    @staticmethod
    async def _average_monthly_expenses(
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> float | None:
        """Return average monthly expenses over the last 3 full months."""
        expense_repo = ExpenseRepository(session)
        today = date.today()
        months: list[tuple[date, date]] = []
        year, month = today.year, today.month
        for _ in range(3):
            month -= 1
            if month == 0:
                month = 12
                year -= 1
            start = date(year, month, 1)
            end = (
                date(year + 1, 1, 1)
                if month == 12
                else date(year, month + 1, 1)
            )
            months.append((start, end))

        total = 0.0
        months_with_data = 0
        for start, end in months:
            spent = await expense_repo.sum_for_period(user_id, start, end)
            if spent > 0:
                total += spent
                months_with_data += 1

        if months_with_data > 0:
            return total / months_with_data

        # Fall back to the user's declared monthly expense estimate.
        estimate_repo = MonthlyExpenseEstimateRepository(session)
        estimate = await estimate_repo.get_total_for_user(user_id)
        return estimate if estimate > 0 else None
