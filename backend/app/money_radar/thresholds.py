"""Centralised Money Radar thresholds.

Every numeric decision boundary used by a detector lives in this module —
nothing is hard-coded inside detector functions. Values are ``Decimal``/
``float`` tuned to the repository's data model and covered by unit tests
in ``tests/money_radar/``.
"""

from __future__ import annotations

from decimal import Decimal


# ── Spending spike ────────────────────────────────────────────────────────
# Current month-to-date spend in a category vs the trailing baseline
# (average of the last N complete months that contain spend).
SPENDING_SPIKE_BASELINE_MONTHS = 3
SPENDING_SPIKE_MIN_RELATIVE = Decimal("0.25")   # +25%
SPENDING_SPIKE_MIN_ABSOLUTE = Decimal("1000")   # ₹1,000 absolute delta
# Severity bands on the relative change.
SPENDING_SPIKE_MEDIUM_RELATIVE = Decimal("0.50")  # +50%
SPENDING_SPIKE_HIGH_RELATIVE = Decimal("1.00")    # +100%

# ── Budget risk ───────────────────────────────────────────────────────────
# Utilisation = month-to-date spend / monthly_limit.
BUDGET_UTIL_LOW = Decimal("0.70")
BUDGET_UTIL_MEDIUM = Decimal("0.85")
BUDGET_UTIL_OVER = Decimal("1.00")
# Only project a month-end figure once this fraction of the month elapsed.
BUDGET_PROJECTION_MIN_ELAPSED = Decimal("0.20")

# ── Cash-flow risk ────────────────────────────────────────────────────────
# Surplus ratio = (income - expenses) / income.
CASHFLOW_THIN_SURPLUS_RATIO = Decimal("0.05")    # <5% surplus → LOW
CASHFLOW_DEFICIT_MEDIUM_RATIO = Decimal("0.10")  # deficit ≤10% income → MEDIUM

# ── Goal delay ────────────────────────────────────────────────────────────
# A goal is "delayed" when required monthly contribution exceeds the
# user's monthly savings pace by this relative margin.
GOAL_DELAY_MIN_SHORTFALL_RATIO = Decimal("0.10")  # pace < 90% of required
GOAL_DELAY_HIGH_SHORTFALL_RATIO = Decimal("0.50")  # pace < 50% of required

# ── Debt opportunity ──────────────────────────────────────────────────────
# Liability.interest_rate is stored as an annual percentage (e.g. 11.5).
DEBT_MIN_INTEREST_RATE_PCT = Decimal("11.0")     # ≥11% APR is costly debt
DEBT_MIN_PRINCIPAL = Decimal("25000")            # ignore trivial balances
# Suggested simulation prepayment = 10% of outstanding, rounded down to
# the nearest ₹5,000 — derived from real data, never arbitrary.
DEBT_PREPAYMENT_SHARE = Decimal("0.10")
DEBT_PREPAYMENT_ROUND = Decimal("5000")
DEBT_PREPAYMENT_MIN = Decimal("10000")

# ── Emergency fund ────────────────────────────────────────────────────────
EMERGENCY_FUND_TARGET_MONTHS = Decimal("6")
EMERGENCY_FUND_MEDIUM_MONTHS = Decimal("3")      # <3 months → HIGH

# ── Tax opportunity ───────────────────────────────────────────────────────
# Regime comparison is only worth surfacing above this annual saving.
TAX_MIN_SAVINGS = Decimal("10000")               # ₹10,000

# ── Recurring cost ────────────────────────────────────────────────────────
RECURRING_MIN_OCCURRENCES = 3                    # ≥3 sightings in window
RECURRING_WINDOW_DAYS = 120                      # ~4 months
RECURRING_MIN_AVG_AMOUNT = Decimal("100")        # ignore trivial amounts
RECURRING_AMOUNT_TOLERANCE = Decimal("0.20")     # ±20% = same charge
RECURRING_MAX_INSIGHTS = 3                       # top clusters only

# ── Net worth change ─────────────────────────────────────────────────────
NETWORTH_MIN_ABSOLUTE_CHANGE = Decimal("10000")  # ₹10,000
NETWORTH_MIN_RELATIVE_CHANGE = Decimal("0.03")   # or ±3%
NETWORTH_MIN_SNAPSHOT_GAP_DAYS = 7               # snapshots ≥7 days apart

# ── Freshness ─────────────────────────────────────────────────────────────
FRESHNESS_RECENT_DAYS = 7      # ≤7d → RECENT
FRESHNESS_STALE_DAYS = 45      # >45d → STALE
