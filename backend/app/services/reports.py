from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weekly_reports import WeeklyReport
from app.repositories.expenses import ExpenseRepository
from app.repositories.income import IncomeRepository
from app.repositories.weekly_reports import WeeklyReportRepository
from app.services.financial import FinancialService


class ReportService:
    """Generate weekly financial reports for users."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._financial = FinancialService(session)
        self._income_repo = IncomeRepository(session)
        self._expense_repo = ExpenseRepository(session)
        self._report_repo = WeeklyReportRepository(session)

    async def generate_weekly_report(self, user_id: uuid.UUID) -> WeeklyReport:
        """Generate and persist a weekly report for a user."""
        today = datetime.now(UTC).date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        weekly_income = Decimal(
            str(await self._income_repo.sum_for_period(user_id, week_start, week_end))
        )
        weekly_expenses = Decimal(
            str(await self._expense_repo.sum_for_period(user_id, week_start, week_end))
        )
        savings = weekly_income - weekly_expenses

        net_worth = await self._financial.calculate_net_worth(user_id)
        budget_analysis = await self._financial.analyze_budget(user_id)
        goal_projections = await self._financial.project_goals(user_id)

        report_data = {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "weekly_income": str(weekly_income),
            "weekly_expenses": str(weekly_expenses),
            "weekly_savings": str(savings),
            "net_worth": net_worth.model_dump(),
            "budget_analysis": budget_analysis.model_dump(),
            "goal_projections": goal_projections.model_dump(),
            "insights": self._generate_insights(savings, weekly_expenses, budget_analysis),
        }

        report = WeeklyReport(
            user_id=user_id,
            report_json=report_data,
            generated_at=datetime.now(UTC),
        )
        return await self._report_repo.create(report)

    def _generate_insights(
        self,
        savings: Decimal,
        expenses: Decimal,
        budget_analysis,
    ) -> list[str]:
        """Generate short educational insights for the report."""
        insights: list[str] = []
        if savings > 0:
            insights.append(f"You saved ₹{savings:,.2f} this week. Great job!")
        elif savings < 0:
            insights.append(
                f"You spent ₹{abs(savings):,.2f} more than you earned this week. Review non-essential expenses."
            )
        else:
            insights.append("Your income matched your expenses this week. Aim for a positive savings rate.")

        for category in budget_analysis.overspending_categories[:3]:
            insights.append(
                f"Category '{category.category_name}' exceeded its budget by ₹{category.overspend:,.2f}."
            )

        return insights

    async def get_latest_report(self, user_id: uuid.UUID) -> WeeklyReport | None:
        """Return the most recent weekly report for a user."""
        return await self._report_repo.get_latest_for_user(user_id)
