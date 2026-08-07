"""Shim over app.financial.tools for backwards-compatible agent imports."""

from __future__ import annotations

from app.financial.tools import get_budget_analysis
from app.financial.tools import get_cash_flow_analysis
from app.financial.tools import get_goal_analysis as get_goal_projections
from app.financial.tools import get_health_analysis as get_health_score
from app.financial.tools import get_networth_analysis as get_net_worth
from app.financial.tools import get_recommendations
from app.financial.tools import get_report
from app.financial.tools import get_retirement_analysis as get_retirement_projection
from app.financial.tools import get_tax_analysis as get_tax_comparison
from app.financial.tools import run_simulation
