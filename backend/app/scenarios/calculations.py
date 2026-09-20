"""Pure deterministic calculation helpers shared by scenario types.

All money math uses ``Decimal``. These are the single source of truth for
compounding, amortisation and comparison arithmetic inside the Scenario
Lab — the legacy ``SimulationEngine`` delegates to them too.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from math import log
from typing import Any

from app.scenarios.scenario_types import MetricDirection


def months_between(start: date, end: date) -> int:
    """Whole months between two dates (minimum 0)."""
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day < start.day:
        months -= 1
    return max(months, 0)


def add_months(d: date, months: int) -> date:
    """Return ``d`` shifted by ``months`` months."""
    total = d.year * 12 + (d.month - 1) + months
    year, month = divmod(total, 12)
    month += 1
    day = min(d.day, _days_in_month(year, month))
    return date(year, month, day)


def _days_in_month(year: int, month: int) -> int:
    if month == 12:
        return 31
    return (date(year, month + 1, 1) - date(year, month, 1)).days


def annuity_future_value(
    monthly_contribution: Decimal,
    annual_rate: Decimal,
    years: int,
) -> Decimal:
    """FV of a level monthly contribution, compounded monthly.

    FV = c * [((1 + r/12)^(12y) - 1) / (r/12)]
    """
    if years <= 0 or monthly_contribution <= 0:
        return Decimal("0")
    n = years * 12
    r = annual_rate / 12
    if r <= 0:
        return monthly_contribution * n
    growth = (Decimal("1") + r) ** n
    return monthly_contribution * (growth - 1) / r


def loan_months_to_close(
    principal: Decimal,
    monthly_rate: Decimal,
    emi: Decimal,
) -> Decimal | None:
    """Months for an EMI to amortise ``principal``.

    n = ln(EMI / (EMI - P*r)) / ln(1 + r)
    Returns ``None`` when the EMI does not cover the monthly interest
    (the loan would never amortise) and ``Decimal("0")`` when the loan is
    already paid off.
    """
    if principal <= 0:
        return Decimal("0")
    if emi <= 0:
        return None
    if monthly_rate <= 0:
        return (principal / emi).to_integral_value(rounding="ROUND_CEILING")
    interest = principal * monthly_rate
    if emi <= interest:
        return None
    months = log(float(emi / (emi - interest))) / log(1 + float(monthly_rate))
    return Decimal(str(months))


def loan_total_cost(
    principal: Decimal,
    monthly_rate: Decimal,
    emi: Decimal,
    months: Decimal | None,
) -> Decimal | None:
    """Total outflow over the loan's life (principal + interest)."""
    if months is None:
        return None
    return emi * months


def classify_change(
    before: Any,
    after: Any,
    *,
    higher_is_better: bool = True,
    tolerance: float = 1e-6,
) -> tuple[Any, MetricDirection]:
    """Deterministic before/after classification.

    Returns ``(change, direction)``. Numeric values get a numeric change;
    dates get months difference; anything else is compared for equality.
    """
    if before is None or after is None:
        return None, MetricDirection.INSUFFICIENT_DATA

    if isinstance(before, date) and isinstance(after, date):
        delta = months_between(before, after)
        if delta == 0:
            return 0, MetricDirection.UNCHANGED
        # higher_is_better=False → an earlier date (negative delta) improves.
        improves = delta < 0 if not higher_is_better else delta > 0
        return delta, MetricDirection.IMPROVES if improves else MetricDirection.WORSENS

    try:
        b = float(before)
        a = float(after)
    except (TypeError, ValueError):
        return (
            None,
            MetricDirection.UNCHANGED if before == after else MetricDirection.INSUFFICIENT_DATA,
        )

    change = a - b
    if abs(change) <= tolerance:
        return 0, MetricDirection.UNCHANGED
    improves = change > 0 if higher_is_better else change < 0
    return change, MetricDirection.IMPROVES if improves else MetricDirection.WORSENS
