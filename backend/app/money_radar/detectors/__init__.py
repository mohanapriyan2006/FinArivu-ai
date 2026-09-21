"""Money Radar detectors — deterministic, side-effect-free finders.

Each detector is registered under the key declared in
``INSIGHT_REGISTRY[type].detector`` so the service can dispatch without
a second mapping table.
"""

from __future__ import annotations

from app.money_radar.detectors import (
    budget,
    cashflow,
    debt,
    emergency_fund,
    goals,
    net_worth,
    recurring,
    spending,
    tax,
)
from app.money_radar.detectors.base import DETECTOR_FUNCS, Detector

DETECTOR_FUNCS.update(
    {
        "spending_spike": spending.detect,
        "budget_risk": budget.detect,
        "cashflow_risk": cashflow.detect,
        "goal_delay": goals.detect,
        "debt_opportunity": debt.detect,
        "emergency_fund": emergency_fund.detect,
        "tax_opportunity": tax.detect,
        "recurring_cost": recurring.detect,
        "networth_change": net_worth.detect,
    }
)

__all__ = ["DETECTOR_FUNCS", "Detector"]
