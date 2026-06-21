"""Financial Health Score Engine.

Pure calculation logic for financial health scoring.
Maximum score: 100
"""

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class FinancialHealthInput:
    """Input data for financial health score calculation."""

    # Income & Expenses
    monthly_income: Decimal
    monthly_expenses: Decimal

    # Emergency Fund
    emergency_assets: Decimal

    # Debt
    total_debt: Decimal
    annual_income: Decimal

    # Goals
    goals: list[dict]  # Each dict has: current_amount, target_amount

    # Budget Discipline
    budget_overall_usage: float


@dataclass
class FinancialHealthResult:
    """Result of financial health score calculation."""

    score: int
    grade: str
    savings_score: int
    emergency_score: int
    debt_score: int
    goal_score: int
    budget_score: int
    insights: list[str]


class FinancialHealthEngine:
    """Engine for calculating financial health scores."""

    @staticmethod
    def _calculate_savings_score(monthly_income: Decimal, monthly_expenses: Decimal) -> int:
        """Calculate savings rate score (max 30)."""
        if monthly_income <= 0:
            return 5

        savings_rate = float((monthly_income - monthly_expenses) / monthly_income * 100)

        if savings_rate >= 30:
            return 30
        elif savings_rate >= 20:
            return 25
        elif savings_rate >= 10:
            return 15
        else:
            return 5

    @staticmethod
    def _calculate_emergency_score(emergency_assets: Decimal, monthly_expenses: Decimal) -> int:
        """Calculate emergency fund score (max 20)."""
        if monthly_expenses <= 0:
            return 5

        months = float(emergency_assets / monthly_expenses)

        if months >= 6:
            return 20
        elif months >= 3:
            return 15
        elif months >= 1:
            return 10
        else:
            return 5

    @staticmethod
    def _calculate_debt_score(total_debt: Decimal, annual_income: Decimal) -> int:
        """Calculate debt ratio score (max 20)."""
        if annual_income <= 0:
            return 20

        debt_ratio = float(total_debt / annual_income * 100)

        if debt_ratio < 20:
            return 20
        elif debt_ratio < 50:
            return 15
        elif debt_ratio <= 100:
            return 10
        else:
            return 5

    @staticmethod
    def _calculate_goal_score(goals: list[dict]) -> int:
        """Calculate goal progress score (max 15)."""
        if not goals:
            return 2

        total_progress = 0.0
        valid_goals = 0

        for goal in goals:
            target = goal.get("target_amount", 0)
            current = goal.get("current_amount", 0)
            if target > 0:
                progress = float(current / target * 100)
                total_progress += progress
                valid_goals += 1

        if valid_goals == 0:
            return 2

        avg_progress = total_progress / valid_goals

        if avg_progress > 75:
            return 15
        elif avg_progress >= 50:
            return 10
        elif avg_progress >= 25:
            return 5
        else:
            return 2

    @staticmethod
    def _calculate_budget_score(budget_overall_usage: float) -> int:
        """Calculate budget discipline score (max 15)."""
        if budget_overall_usage < 90:
            return 15
        elif budget_overall_usage <= 100:
            return 10
        elif budget_overall_usage <= 110:
            return 5
        else:
            return 2

    @staticmethod
    def _get_grade(score: int) -> str:
        """Determine grade from total score."""
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Fair"
        else:
            return "Needs Improvement"

    @staticmethod
    def _generate_insights(data: FinancialHealthInput, result: FinancialHealthResult) -> list[str]:
        """Generate educational insights based on score components."""
        insights: list[str] = []

        # Savings insight
        if result.savings_score >= 25:
            insights.append("Your savings rate is healthy. Keep up the good habit.")
        elif result.savings_score <= 5:
            insights.append("Your savings rate is low. Consider tracking expenses to identify areas to reduce.")

        # Emergency fund insight
        if result.emergency_score >= 15:
            insights.append("Your emergency fund provides good coverage.")
        elif result.emergency_score <= 5:
            insights.append("Building an emergency fund should be a priority. Aim for 3-6 months of expenses.")

        # Debt insight
        if result.debt_score <= 10:
            insights.append("Your debt-to-income ratio is elevated. Consider strategies to reduce debt.")

        # Budget insight
        if result.budget_score <= 5:
            insights.append("Your spending exceeded your budget. Review discretionary expenses.")

        return insights

    @classmethod
    def calculate(cls, data: FinancialHealthInput) -> FinancialHealthResult:
        """Calculate complete financial health score.

        Args:
            data: FinancialHealthInput with all required data.

        Returns:
            FinancialHealthResult with scores and insights.
        """
        savings_score = cls._calculate_savings_score(data.monthly_income, data.monthly_expenses)
        emergency_score = cls._calculate_emergency_score(data.emergency_assets, data.monthly_expenses)
        debt_score = cls._calculate_debt_score(data.total_debt, data.annual_income)
        goal_score = cls._calculate_goal_score(data.goals)
        budget_score = cls._calculate_budget_score(data.budget_overall_usage)

        total_score = (
            savings_score +
            emergency_score +
            debt_score +
            goal_score +
            budget_score
        )

        grade = cls._get_grade(total_score)

        result = FinancialHealthResult(
            score=total_score,
            grade=grade,
            savings_score=savings_score,
            emergency_score=emergency_score,
            debt_score=debt_score,
            goal_score=goal_score,
            budget_score=budget_score,
            insights=[],
        )

        result.insights = cls._generate_insights(data, result)

        return result
