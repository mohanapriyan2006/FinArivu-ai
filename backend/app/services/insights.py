from __future__ import annotations

import asyncio
import uuid
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.budgets import BudgetRepository
from app.repositories.categories import ExpenseCategoryRepository
from app.repositories.expenses import ExpenseRepository
from app.repositories.income import IncomeRepository
from app.schemas.financial import (
    BudgetAnalysisResponse,
    DashboardResponse,
    GoalProjectionsResponse,
    HealthScoreResponse,
)
from app.schemas.insights import (
    FinancialHealth,
    HealthFactor,
    InsightCard,
    InsightsResponse,
    MissingDataItem,
    Trend,
    WeeklyMetric,
)
from app.services.financial import FinancialService
from app.services.financial_profile import FinancialProfileService


class InsightsService:
    """Aggregates all data and intelligence for the Insights screen."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._financial = FinancialService(session)
        self._profile = FinancialProfileService(session)
        self._income_repo = IncomeRepository(session)
        self._expense_repo = ExpenseRepository(session)
        self._budget_repo = BudgetRepository(session)
        self._category_repo = ExpenseCategoryRepository(session)

    async def get_insights(self, user_id: uuid.UUID) -> InsightsResponse:
        """Return the full dynamic insights payload for a user."""
        today = date.today()

        # Fetch core aggregates in parallel.
        health_task = self._financial.calculate_health_score(user_id)
        dashboard_task = self._financial.get_dashboard(user_id)
        budget_task = self._financial.analyze_budget(user_id)
        goals_task = self._financial.project_goals(user_id)
        completion_task = self._profile.get_completion(user_id)

        health, dashboard, budget_analysis, goal_projections, completion = await asyncio.gather(
            health_task,
            dashboard_task,
            budget_task,
            goals_task,
            completion_task,
        )

        # Weekly windows.
        week_ago = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)

        weekly_expenses, prior_weekly_expenses, weekly_income = await asyncio.gather(
            self._sum_expenses(user_id, week_ago, today),
            self._sum_expenses(user_id, two_weeks_ago, week_ago - timedelta(days=1)),
            self._sum_income(user_id, week_ago, today),
        )

        # Missing data prompts.
        budget_exists = await self._budget_repo.exists(user_id=user_id)
        missing = self._build_missing(completion, budget_exists)

        # If the user has no data at all, return early with just the missing list.
        if not missing:
            missing = self._default_missing()

        has_data = completion["core_ready"] or completion["completion_percentage"] > 0

        financial_health = self._build_health(health)
        top_insight = self._build_top_insight(dashboard, budget_analysis, goal_projections, health)
        weekly = self._build_weekly(weekly_income, weekly_expenses)
        trends = self._build_trends(weekly_income, weekly_expenses, prior_weekly_expenses, dashboard)
        attention = self._build_attention(budget_analysis, goal_projections, health, dashboard)
        positive = self._build_positive(dashboard, budget_analysis, goal_projections, health)

        return InsightsResponse(
            has_data=has_data,
            health=financial_health if has_data else None,
            top_insight=top_insight,
            weekly=weekly,
            trends=trends,
            attention=attention,
            positive=positive,
            missing=missing,
        )

    async def _sum_expenses(
        self,
        user_id: uuid.UUID,
        start: date,
        end: date,
    ) -> Decimal:
        return Decimal(str(await self._expense_repo.sum_for_period(user_id, start, end)))

    async def _sum_income(
        self,
        user_id: uuid.UUID,
        start: date,
        end: date,
    ) -> Decimal:
        return Decimal(str(await self._income_repo.sum_for_period(user_id, start, end)))

    def _build_missing(
        self,
        completion: dict[str, Any],
        budget_exists: bool,
    ) -> list[MissingDataItem]:
        missing: list[MissingDataItem] = []
        for section in completion.get("missing_sections", []):
            item = self._missing_item(section)
            if item:
                missing.append(item)

        # Budgets are tracked separately from the onboarding completion.
        if not budget_exists:
            item = self._missing_item("budgets")
            if item:
                missing.append(item)

        return missing

    def _missing_item(self, section: str) -> MissingDataItem | None:
        mapping = {
            "aboutYou": (
                "Complete your profile",
                "Finish your basic profile so we can personalise insights.",
                "Complete Profile",
                "FinancialProfileSetup",
            ),
            "income": (
                "Add income",
                "Set up your income to track cash flow and savings.",
                "Add Income",
                "IncomeTracker",
            ),
            "expenses": (
                "Add expenses",
                "Log your monthly expenses to see spending trends.",
                "Add Expense",
                "QuickAddExpense",
            ),
            "savings": (
                "Add savings",
                "Record your emergency and general savings.",
                "Add Savings",
                "SavingsTracker",
            ),
            "investments": (
                "Add investments",
                "Add your investments to track net worth growth.",
                "Add Investments",
                "InvestmentTracker",
            ),
            "loans": (
                "Add loans",
                "Add any loans or liabilities to monitor debt.",
                "Add Loans",
                "LoanTracker",
            ),
            "goals": (
                "Add goals",
                "Set a financial goal to start tracking progress.",
                "Add Goals",
                "GoalTracker",
            ),
            "budgets": (
                "Set budgets",
                "Create monthly budgets by category to avoid overspending.",
                "Set Budgets",
                "BudgetTracker",
            ),
        }
        if section not in mapping:
            return None
        title, explanation, action_label, route = mapping[section]
        return MissingDataItem(
            id=section,
            title=title,
            explanation=explanation,
            action_label=action_label,
            route=route,
        )

    def _default_missing(self) -> list[MissingDataItem]:
        return [
            self._missing_item("aboutYou"),
            self._missing_item("income"),
            self._missing_item("expenses"),
            self._missing_item("savings"),
            self._missing_item("investments"),
            self._missing_item("loans"),
            self._missing_item("goals"),
        ]

    def _build_health(self, health: HealthScoreResponse) -> FinancialHealth:
        score = int(health.overall_score)
        status = self._overall_status(score)

        factors = [
            self._build_factor("savings", "Savings", health.savings_score, 30),
            self._build_factor("emergency", "Emergency", health.emergency_score, 20),
            self._build_factor("debt", "Debt", health.debt_score, 20),
            self._build_factor("goals", "Goals", health.goal_score, 15),
            self._build_factor("budget", "Budget", health.budget_score, 15),
        ]

        # Pick the weakest recommendation for the explanation, or a default.
        recommendation = "Keep tracking your finances to improve."
        if health.recommendations:
            # Find the weakest factor to surface its message.
            factor_values = [
                ("savings", health.savings_score, 30),
                ("emergency", health.emergency_score, 20),
                ("debt", health.debt_score, 20),
                ("goals", health.goal_score, 15),
                ("budget", health.budget_score, 15),
            ]
            weakest = min(factor_values, key=lambda x: x[1] / x[2])
            index = [f[0] for f in factor_values].index(weakest[0])
            recommendation = health.recommendations[index]

        return FinancialHealth(
            score=score,
            status=status,
            factors=factors,
            explanation=recommendation,
        )

    def _build_factor(self, id: str, name: str, score: Decimal, max_score: int) -> HealthFactor:
        ratio = float(score) / max_score if max_score else 0
        if ratio >= 0.7:
            status = "good"
        elif ratio >= 0.3:
            status = "warning"
        else:
            status = "danger"
        return HealthFactor(id=id, name=name, status=status)

    def _overall_status(self, score: int) -> str:
        if score >= 80:
            return "excellent"
        if score >= 60:
            return "good"
        if score >= 40:
            return "fair"
        return "needs_attention"

    def _build_top_insight(
        self,
        dashboard: DashboardResponse,
        budget: BudgetAnalysisResponse,
        goals: GoalProjectionsResponse,
        health: HealthScoreResponse,
    ) -> InsightCard | None:
        # 1. Budget overspending.
        if budget.overspending_categories:
            over = budget.overspending_categories[0]
            return InsightCard(
                category="BUDGET",
                title=f"{over.category_name} is over budget",
                explanation=f"You spent {float(over.spent):,.0f}, which is {float(over.usage):.0f}% of your {float(over.budget):,.0f} budget.",
                metric=f"+₹{float(over.overspend):,.0f}",
                action_label="View budget",
                route="BudgetTracker",
            )

        # 2. Goal behind.
        behind = [g for g in goals.goals if g.status in {"behind", "at_risk"}]
        if behind:
            goal = behind[0]
            return InsightCard(
                category="GOAL",
                title=f"{goal.monthly_contribution:,.0f} monthly for goal",
                explanation="Increase your monthly contribution to stay on track.",
                metric=f"₹{float(goal.monthly_contribution):,.0f}/mo",
                action_label="View goals",
                route="GoalTracker",
            )

        # 3. Negative cash flow.
        cash_flow = float(dashboard.net_cash_flow)
        if cash_flow < 0:
            return InsightCard(
                category="CASHFLOW",
                title="Spending exceeds income",
                explanation="Your expenses this month are higher than your income.",
                metric=f"-₹{abs(cash_flow):,.0f}",
                action_label="View expenses",
                route="ExpenseTracker",
            )

        # 4. Positive cash flow / savings.
        if cash_flow > 0:
            income = float(dashboard.total_income)
            rate = (cash_flow / income * 100) if income else 0
            return InsightCard(
                category="SAVINGS",
                title="You are building savings",
                explanation=f"You saved {rate:.0f}% of your income this month.",
                metric=f"+₹{cash_flow:,.0f}",
                action_label="View savings",
                route="SavingsTracker",
            )

        # 5. Health fallback.
        return InsightCard(
            category="HEALTH",
            title="Financial health score",
            explanation=health.recommendations[0] if health.recommendations else "Track your finances to get personalised insights.",
            metric=f"{int(health.overall_score)}/100",
            action_label="View details",
            route="FinancialHealth",
        )

    def _build_weekly(
        self,
        income: Decimal,
        expenses: Decimal,
    ) -> list[WeeklyMetric]:
        saved = income - expenses
        return [
            WeeklyMetric(id="income", label="Income", value=f"₹{float(income):,.0f}"),
            WeeklyMetric(id="spent", label="Spent", value=f"₹{float(expenses):,.0f}"),
            WeeklyMetric(id="saved", label="Saved", value=f"{'+' if saved >= 0 else ''}₹{float(saved):,.0f}"),
            WeeklyMetric(id="net", label="Net", value=f"{'+' if saved >= 0 else ''}₹{float(saved):,.0f}"),
        ]

    def _build_trends(
        self,
        weekly_income: Decimal,
        weekly_expenses: Decimal,
        prior_weekly_expenses: Decimal,
        dashboard: DashboardResponse,
    ) -> list[Trend]:
        trends: list[Trend] = []

        def pct_delta(current: float, previous: float) -> float:
            if previous == 0:
                return 0 if current == 0 else 100
            return round(((current - previous) / previous) * 100, 1)

        # Spending trend (last 7 days vs prior 7 days).
        current_exp = float(weekly_expenses)
        prior_exp = float(prior_weekly_expenses)
        delta = pct_delta(current_exp, prior_exp)
        trends.append(
            Trend(
                id="spending",
                label="Spending",
                from_value=f"₹{prior_exp:,.0f}",
                to_value=f"₹{current_exp:,.0f}",
                delta=f"{abs(delta):.0f}%",
                is_positive=(delta < 0),
            )
        )

        # Net cash flow trend (this month vs a simple zero baseline).
        flow = float(dashboard.net_cash_flow)
        trends.append(
            Trend(
                id="cashflow",
                label="Monthly cash flow",
                from_value="₹0",
                to_value=f"₹{flow:,.0f}",
                delta=f"{abs(flow):,.0f}",
                is_positive=(flow > 0),
            )
        )

        return trends

    def _build_attention(
        self,
        budget: BudgetAnalysisResponse,
        goals: GoalProjectionsResponse,
        health: HealthScoreResponse,
        dashboard: DashboardResponse,
    ) -> list[InsightCard]:
        attention: list[InsightCard] = []

        for over in budget.overspending_categories[:2]:
            attention.append(
                InsightCard(
                    category="BUDGET",
                    title=f"{over.category_name} is above budget",
                    explanation=f"You spent {float(over.spent):,.0f} against a {float(over.budget):,.0f} limit.",
                    metric=f"+₹{float(over.overspend):,.0f}",
                    action_label="View budget",
                    route="BudgetTracker",
                )
            )

        for goal in goals.goals[:1]:
            if goal.status in {"behind", "at_risk"}:
                attention.append(
                    InsightCard(
                        category="GOAL",
                        title="Goal is off track",
                        explanation="Increase your monthly contribution to catch up.",
                        metric=f"₹{float(goal.monthly_contribution):,.0f}/mo needed",
                        action_label="View goals",
                        route="GoalTracker",
                    )
                )

        if float(health.emergency_score) < 10 and not any(a.title == "Emergency" for a in attention):
            attention.append(
                InsightCard(
                    category="EMERGENCY",
                    title="Emergency fund is low",
                    explanation="Build 3–6 months of expenses for a safety net.",
                    metric="<1 month",
                    action_label="Add savings",
                    route="SavingsTracker",
                )
            )

        total_debt = float(dashboard.total_liabilities)
        if total_debt > 0 and float(health.debt_score) < 10:
            attention.append(
                InsightCard(
                    category="DEBT",
                    title="Debt is high relative to income",
                    explanation="Focus on repaying high-interest liabilities.",
                    metric=f"₹{total_debt:,.0f}",
                    action_label="View loans",
                    route="LoanTracker",
                )
            )

        return attention[:3]

    def _build_positive(
        self,
        dashboard: DashboardResponse,
        budget: BudgetAnalysisResponse,
        goals: GoalProjectionsResponse,
        health: HealthScoreResponse,
    ) -> list[InsightCard]:
        positive: list[InsightCard] = []

        cash_flow = float(dashboard.net_cash_flow)
        if cash_flow > 0:
            positive.append(
                InsightCard(
                    category="CASHFLOW",
                    title="Cash flow is positive",
                    explanation="You are spending less than you earn this month.",
                    metric=f"+₹{cash_flow:,.0f}",
                    action_label="View details",
                    route="FinancialHealth",
                )
            )

        if budget.overall_utilization < Decimal("0.90") and budget.total_budget > 0:
            positive.append(
                InsightCard(
                    category="BUDGET",
                    title="Budget on track",
                    explanation="You are spending within your budget limits.",
                    metric=f"{float(budget.overall_utilization) * 100:.0f}%",
                    action_label="View budget",
                    route="BudgetTracker",
                )
            )

        if float(health.savings_score) >= 25:
            positive.append(
                InsightCard(
                    category="SAVINGS",
                    title="Healthy savings rate",
                    explanation="You are saving a strong portion of your income.",
                    metric=f"{float(health.savings_score):.0f}/30",
                    action_label="View savings",
                    route="SavingsTracker",
                )
            )

        on_track = all(g.status == "on_track" for g in goals.goals)
        if goals.goals and on_track:
            positive.append(
                InsightCard(
                    category="GOAL",
                    title="Goals are on track",
                    explanation="Your current savings rate keeps your goals on schedule.",
                    metric=f"{len(goals.goals)} goal(s)",
                    action_label="View goals",
                    route="GoalTracker",
                )
            )

        if float(dashboard.total_liabilities) == 0:
            positive.append(
                InsightCard(
                    category="DEBT",
                    title="No debt on record",
                    explanation="You are debt free. Maintain your spending discipline.",
                    metric="₹0",
                    action_label="View net worth",
                    route="FinancialHealth",
                )
            )

        return positive[:3]
