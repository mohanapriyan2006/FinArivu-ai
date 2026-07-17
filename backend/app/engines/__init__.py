"""Deterministic financial calculation engines for FinArivu AI."""

from app.engines.budget_engine import BudgetAnalysis, analyze_budget
from app.engines.goal_engine import GoalProjection, project_goals
from app.engines.health_score import HealthScoreResult, calculate_health_score
from app.engines.networth_engine import NetWorthResult, calculate_net_worth
from app.engines.retirement_engine import RetirementProjection, project_retirement
from app.engines.tax_engine import TaxCalculation, calculate_tax

__all__ = [
    "BudgetAnalysis",
    "analyze_budget",
    "GoalProjection",
    "project_goals",
    "HealthScoreResult",
    "calculate_health_score",
    "NetWorthResult",
    "calculate_net_worth",
    "RetirementProjection",
    "project_retirement",
    "TaxCalculation",
    "calculate_tax",
]
