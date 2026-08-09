from __future__ import annotations

import uuid
from calendar import monthrange
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.budget_engine import analyze_budget
from app.engines.goal_engine import project_goals
from app.engines.health_score import calculate_health_score
from app.engines.networth_engine import calculate_net_worth
from app.engines.retirement_engine import project_retirement
from app.engines.tax_engine import Deductions, calculate_tax
from app.exceptions import NotFoundError
from app.models.profiles import Profile
from app.repositories.assets import AssetRepository
from app.repositories.budgets import BudgetRepository
from app.repositories.categories import ExpenseCategoryRepository
from app.repositories.expenses import ExpenseRepository
from app.repositories.goals import GoalRepository
from app.repositories.income import IncomeRepository
from app.repositories.liabilities import LiabilityRepository
from app.repositories.profiles import ProfileRepository
from app.schemas.financial import (
    BudgetAnalysisCategory,
    BudgetAnalysisResponse,
    DashboardCard,
    DashboardResponse,
    GoalContributionResponse,
    GoalProjectionsResponse,
    HealthScoreResponse,
    NetWorthResponse,
    RetirementResponse,
    TaxRequest,
    TaxResponse,
)


class FinancialService:
    """Orchestrates deterministic financial calculations across repositories."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._income_repo = IncomeRepository(session)
        self._expense_repo = ExpenseRepository(session)
        self._category_repo = ExpenseCategoryRepository(session)
        self._budget_repo = BudgetRepository(session)
        self._goal_repo = GoalRepository(session)
        self._asset_repo = AssetRepository(session)
        self._liability_repo = LiabilityRepository(session)
        self._profile_repo = ProfileRepository(session)

    async def _get_or_create_profile(self, user_id: uuid.UUID) -> Profile:
        profile = await self._profile_repo.get_by_user_id(user_id)
        if profile is None:
            profile = Profile(user_id=user_id)
            await self._profile_repo.create(profile)
        return profile

    async def _monthly_income(self, user_id: uuid.UUID, year: int, month: int) -> Decimal:
        start, end = self._month_bounds(year, month)
        return Decimal(str(await self._income_repo.sum_for_period(user_id, start, end)))

    async def _monthly_expenses(self, user_id: uuid.UUID, year: int, month: int) -> Decimal:
        start, end = self._month_bounds(year, month)
        return Decimal(str(await self._expense_repo.sum_for_period(user_id, start, end)))

    @staticmethod
    def _month_bounds(year: int, month: int) -> tuple[date, date]:
        start = date(year, month, 1)
        _, last_day = monthrange(year, month)
        end = date(year, month, last_day)
        return start, end

    async def calculate_health_score(
        self,
        user_id: uuid.UUID,
        year: int | None = None,
        month: int | None = None,
    ) -> HealthScoreResponse:
        """Compute the financial health score for a user."""
        if year is None or month is None:
            today = date.today()
            year, month = today.year, today.month

        profile = await self._get_or_create_profile(user_id)
        monthly_income = Decimal(str(profile.monthly_income or 0))
        if monthly_income <= 0:
            monthly_income = await self._monthly_income(user_id, year, month)

        monthly_expenses = await self._monthly_expenses(user_id, year, month)
        if monthly_expenses <= 0:
            monthly_expenses = Decimal("1")

        assets = await self._asset_repo.list_for_user(user_id, limit=1000)
        emergency_assets = sum(
            Decimal(str(a.value)) for a in assets if a.is_emergency_fund
        )

        liabilities = await self._liability_repo.list_for_user(user_id, limit=1000)
        total_debt = sum(Decimal(str(l.amount)) for l in liabilities)

        annual_income = monthly_income * Decimal("12")

        goals = await self._goal_repo.list_for_user(user_id, limit=1000)
        if goals:
            avg_goal_progress = sum(
                Decimal(str(g.current_amount)) / Decimal(str(g.target_amount))
                for g in goals
                if g.target_amount > 0
            ) / len(goals)
        else:
            avg_goal_progress = Decimal("0")

        budgets = await self._budget_repo.list_for_user(user_id, limit=1000)
        budget_ids = [b.category_id for b in budgets]
        start, end = self._month_bounds(year, month)
        spending_by_category: dict[str, Decimal] = {}
        if budget_ids:
            rows: Sequence[tuple[uuid.UUID, float]] = await self._expense_repo.sum_by_category(
                user_id, start, end
            )
            for cid, amount in rows:
                if cid in budget_ids:
                    spending_by_category[str(cid)] = Decimal(str(amount))

        if budgets:
            utilization_sum = Decimal("0")
            for budget in budgets:
                spent = spending_by_category.get(str(budget.category_id), Decimal("0"))
                limit = Decimal(str(budget.monthly_limit))
                if limit > 0:
                    utilization_sum += spent / limit
            avg_budget_utilization = utilization_sum / len(budgets)
        else:
            avg_budget_utilization = Decimal("0")

        result = calculate_health_score(
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
            emergency_assets=emergency_assets,
            total_debt=total_debt,
            annual_income=annual_income,
            average_goal_progress=avg_goal_progress,
            average_budget_utilization=avg_budget_utilization,
        )

        return HealthScoreResponse(
            overall_score=result.overall_score,
            savings_score=result.savings_score,
            emergency_score=result.emergency_score,
            debt_score=result.debt_score,
            goal_score=result.goal_score,
            budget_score=result.budget_score,
            breakdown=result.breakdown,
            recommendations=result.recommendations,
        )

    async def calculate_net_worth(self, user_id: uuid.UUID) -> NetWorthResponse:
        """Compute net worth for a user."""
        assets = await self._asset_repo.list_for_user(user_id, limit=1000)
        liabilities = await self._liability_repo.list_for_user(user_id, limit=1000)

        asset_rows = [
            {"asset_type": a.asset_type, "value": a.value} for a in assets
        ]
        liability_rows = [
            {"liability_type": l.liability_type, "amount": l.amount} for l in liabilities
        ]

        result = calculate_net_worth(asset_rows, liability_rows)
        return NetWorthResponse(
            total_assets=result.total_assets,
            total_liabilities=result.total_liabilities,
            net_worth=result.net_worth,
            asset_breakdown=result.asset_breakdown,
            liability_breakdown=result.liability_breakdown,
            asset_count=result.asset_count,
            liability_count=result.liability_count,
        )

    async def analyze_budget(
        self,
        user_id: uuid.UUID,
        year: int | None = None,
        month: int | None = None,
    ) -> BudgetAnalysisResponse:
        """Analyze budgets vs actual spending for a user."""
        if year is None or month is None:
            today = date.today()
            year, month = today.year, today.month

        start, end = self._month_bounds(year, month)

        profile = await self._get_or_create_profile(user_id)
        monthly_income = Decimal(str(profile.monthly_income or 0))
        if monthly_income <= 0:
            monthly_income = await self._monthly_income(user_id, year, month)

        budgets = await self._budget_repo.list_for_user(user_id, limit=1000)
        total_spent = Decimal(str(await self._expense_repo.sum_for_period(user_id, start, end)))

        category_spending: dict[str, Decimal] = {}
        rows = await self._expense_repo.sum_by_category(user_id, start, end)
        for cid, amount in rows:
            category_spending[str(cid)] = Decimal(str(amount))

        budgets_dict: dict[str, tuple[str, Decimal]] = {}
        for budget in budgets:
            category = budget.category
            name = category.name if category else "Unknown"
            budgets_dict[str(budget.category_id)] = (
                name,
                Decimal(str(budget.monthly_limit)),
            )

        result = analyze_budget(
            monthly_income=monthly_income,
            total_spent=total_spent,
            category_spending=category_spending,
            budgets=budgets_dict,
        )

        categories = [
            BudgetAnalysisCategory(
                category_id=uuid.UUID(c.category_id),
                category_name=c.category_name,
                budget=c.budget,
                spent=c.spent,
                usage=c.usage,
                overspend=c.overspend,
                status=c.status,
            )
            for c in result.categories
        ]
        overspending = [
            BudgetAnalysisCategory(
                category_id=uuid.UUID(c.category_id),
                category_name=c.category_name,
                budget=c.budget,
                spent=c.spent,
                usage=c.usage,
                overspend=c.overspend,
                status=c.status,
            )
            for c in result.overspending_categories
        ]

        return BudgetAnalysisResponse(
            total_budget=result.total_budget,
            total_spent=result.total_spent,
            overall_utilization=result.overall_utilization,
            remaining_budget=result.remaining_budget,
            categories=categories,
            overspending_categories=overspending,
            savings_opportunity=result.savings_opportunity,
            recommendations=result.recommendations,
        )

    async def project_goals(self, user_id: uuid.UUID) -> GoalProjectionsResponse:
        """Project monthly contributions for all active user goals."""
        goals = await self._goal_repo.list_for_user(user_id, limit=1000)
        goal_rows = [
            {
                "id": g.id,
                "goal_name": g.goal_name,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "target_date": g.target_date.isoformat() if g.target_date else None,
            }
            for g in goals
        ]

        today = date.today()
        profile = await self._get_or_create_profile(user_id)
        monthly_income = Decimal(str(profile.monthly_income or 0))
        start, end = self._month_bounds(today.year, today.month)
        if monthly_income <= 0:
            monthly_income = await self._monthly_income(user_id, today.year, today.month)
        monthly_expenses = await self._monthly_expenses(user_id, today.year, today.month)
        monthly_savings = monthly_income - monthly_expenses

        projections = project_goals(goal_rows, monthly_savings_rate=monthly_savings)

        return GoalProjectionsResponse(
            goals=[
                GoalContributionResponse(
                    goal_id=uuid.UUID(p.goal_id),
                    monthly_contribution=p.monthly_contribution,
                    months_remaining=p.months_remaining,
                    completion_percentage=p.completion_percentage,
                    status=p.status,
                    suggestions=p.suggestions,
                )
                for p in projections.goals
            ],
            total_monthly_contribution=projections.total_monthly_contribution,
        )

    async def get_dashboard(self, user_id: uuid.UUID) -> DashboardResponse:
        """Aggregate all data needed for the home dashboard."""
        today = date.today()
        start, end = self._month_bounds(today.year, today.month)

        assets = await self._asset_repo.list_for_user(user_id, limit=1000)
        liabilities = await self._liability_repo.list_for_user(user_id, limit=1000)

        asset_rows = [
            {"asset_type": a.asset_type, "value": a.value} for a in assets
        ]
        liability_rows = [
            {"liability_type": l.liability_type, "amount": l.amount} for l in liabilities
        ]
        net_worth_result = calculate_net_worth(asset_rows, liability_rows)

        total_income = Decimal(str(await self._income_repo.sum_for_period(user_id, start, end)))
        total_expenses = Decimal(str(await self._expense_repo.sum_for_period(user_id, start, end)))

        recent_income = await self._income_repo.list_for_user(user_id, start_date=start, end_date=end, limit=5)
        recent_expenses = await self._expense_repo.list_for_user(user_id, start_date=start, end_date=end, limit=5)

        category_rows = await self._expense_repo.sum_by_category(user_id, start, end)
        categories = await self._category_repo.list(limit=1000)
        category_names = {c.id: c.name for c in categories}
        expense_breakdown = [
            {"category": category_names.get(category_id, str(category_id)), "amount": float(amount)}
            for category_id, amount in category_rows
        ]

        def sum_asset(types: set[str]) -> tuple[Decimal, int]:
            matched = [a for a in assets if a.asset_type in types]
            value = sum(Decimal(str(a.value)) for a in matched)
            return value, len(matched)

        def sum_liability(types: set[str]) -> tuple[Decimal, int]:
            matched = [l for l in liabilities if l.liability_type in types]
            amount = sum(Decimal(str(l.amount)) for l in matched)
            return amount, len(matched)

        checking_value, checking_count = sum_asset({"Cash", "Bank"})
        investment_value, investment_count = sum_asset({
            "Mutual Fund", "Stock", "PPF", "EPF", "NPS", "Crypto",
        })
        credit_card_value, credit_card_count = sum_liability({"Credit Card"})
        loan_value, loan_count = sum_liability({
            "Home Loan", "Car Loan", "Personal Loan", "Education Loan", "Medical Loan", "Other",
        })

        cards = [
            DashboardCard(
                id="checking",
                title="Checking",
                label="Assets",
                value=checking_value,
                count=checking_count,
                has_data=checking_count > 0,
                route="SavingsTracker",
            ),
            DashboardCard(
                id="investments",
                title="Investments",
                label="Assets",
                value=investment_value,
                count=investment_count,
                has_data=investment_count > 0,
                route="InvestmentTracker",
            ),
            DashboardCard(
                id="credit_cards",
                title="Credit Cards",
                label="Liabilities",
                value=credit_card_value,
                count=credit_card_count,
                has_data=credit_card_count > 0,
                route="CreditCardTracker",
            ),
            DashboardCard(
                id="loan",
                title="Loan",
                label="Liabilities",
                value=loan_value,
                count=loan_count,
                has_data=loan_count > 0,
                route="LoanTracker",
            ),
        ]

        return DashboardResponse(
            total_income=total_income,
            total_expenses=total_expenses,
            net_cash_flow=total_income - total_expenses,
            net_worth=net_worth_result.net_worth,
            total_assets=net_worth_result.total_assets,
            total_liabilities=net_worth_result.total_liabilities,
            recent_income=[
                {"id": str(i.id), "source": i.source, "amount": float(i.amount), "income_date": i.income_date.isoformat() if i.income_date else None}
                for i in recent_income
            ],
            recent_expenses=[
                {"id": str(e.id), "description": e.description, "amount": float(e.amount), "expense_date": e.expense_date.isoformat() if e.expense_date else None}
                for e in recent_expenses
            ],
            expense_breakdown=expense_breakdown,
            cards=cards,
        )

    @staticmethod
    def calculate_tax(request: TaxRequest) -> TaxResponse:
        """Calculate income tax using the tax engine."""
        deductions = Deductions(
            section_80c=request.deductions.section_80c,
            section_80ccd_1b=request.deductions.section_80ccd_1b,
            section_80d=request.deductions.section_80d,
            hra=request.deductions.hra,
            lta=request.deductions.lta,
            section_80e=request.deductions.section_80e,
            section_80g=request.deductions.section_80g,
            standard_deduction=request.deductions.standard_deduction,
        )
        result = calculate_tax(
            gross_income=request.gross_income,
            deductions=deductions,
            regime=request.regime,
        )
        return TaxResponse(
            regime=result.regime,
            gross_income=result.gross_income,
            deductions_applied=result.deductions_applied,
            taxable_income=result.taxable_income,
            tax_before_cess=result.tax_before_cess,
            cess=result.cess,
            total_tax=result.total_tax,
            effective_tax_rate=result.effective_tax_rate,
            notes=result.notes,
        )

    @staticmethod
    def project_retirement(request: dict[str, Any]) -> RetirementResponse:
        """Project retirement corpus using the retirement engine."""
        result = project_retirement(
            current_age=request["current_age"],
            retirement_age=request["retirement_age"],
            monthly_expenses=request["monthly_expenses"],
            inflation_rate=request["inflation_rate"],
            safe_withdrawal_rate=request["safe_withdrawal_rate"],
        )
        return RetirementResponse(
            current_age=result.current_age,
            retirement_age=result.retirement_age,
            years_to_retirement=result.years_to_retirement,
            current_monthly_expenses=result.current_monthly_expenses,
            inflation_rate=result.inflation_rate,
            future_monthly_expenses=result.future_monthly_expenses,
            future_annual_expenses=result.future_annual_expenses,
            retirement_corpus=result.retirement_corpus,
            safe_withdrawal_rate=result.safe_withdrawal_rate,
            notes=result.notes,
        )
