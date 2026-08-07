"""Tool layer that exposes financial engines to the AI agents."""

from __future__ import annotations

from app.financial.tools.budget_tool import get_budget_analysis
from app.financial.tools.cashflow_tool import get_cash_flow_analysis
from app.financial.tools.goal_tool import get_goal_analysis
from app.financial.tools.health_tool import get_health_analysis
from app.financial.tools.networth_tool import get_networth_analysis
from app.financial.tools.recommendation_tool import get_recommendations
from app.financial.tools.report_tool import get_report
from app.financial.tools.retirement_tool import get_retirement_analysis
from app.financial.tools.simulation_tool import run_simulation
from app.financial.tools.tax_tool import get_tax_analysis

__all__ = [
    "get_budget_analysis",
    "get_cash_flow_analysis",
    "get_goal_analysis",
    "get_health_analysis",
    "get_networth_analysis",
    "get_recommendations",
    "get_report",
    "get_retirement_analysis",
    "run_simulation",
    "get_tax_analysis",
]
