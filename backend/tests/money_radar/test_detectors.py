"""Detector unit tests — synthetic RadarContext, no database.

Every number asserted here is computed by the detector from the context —
mirroring the deterministic contract (no LLM involvement).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from app.money_radar.context import MonthWindow, RadarContext
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
from app.money_radar.radar_types import (
    DataAvailability,
    InsightSeverity,
    InsightType,
)


def _ctx(**overrides) -> RadarContext:
    now = datetime.now(timezone.utc)
    ctx = RadarContext(user_id=uuid.uuid4(), now=now, today=now.date())
    ctx.category_names = {"cat-1": "Dining", "cat-2": "Transport"}
    for key, value in overrides.items():
        setattr(ctx, key, value)
    return ctx


def _month(year: int, month: int, total: Decimal, by_cat=None, count=5):
    start = date(year, month, 1)
    end = (
        date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    )
    return MonthWindow(
        label=f"{year:04d}-{month:02d}",
        start=start,
        end=end,
        elapsed_ratio=Decimal("1"),
        total=total,
        by_category=by_cat or {},
        count=count,
    )


# ── Spending spike ──────────────────────────────────────────────────────


class TestSpendingSpike:
    def test_spike_detected(self):
        today = date.today()
        current = _month(
            today.year,
            today.month,
            Decimal("25000"),
            by_cat={"cat-1": Decimal("25000")},
            count=8,
        )
        # Pretend we're mid-month so the comparison window is meaningful.
        current.elapsed_ratio = Decimal("0.5")
        baseline = [
            _month(today.year, m, Decimal("20000"), {"cat-1": Decimal("20000")})
            for m in range(max(1, today.month - 3), today.month)
        ]
        ctx = _ctx(current_month=current, baseline_months=baseline)
        findings = spending.detect(ctx)
        assert len(findings) == 1
        f = findings[0]
        assert f.insight_type == InsightType.SPENDING_SPIKE
        assert f.entity_name == "Dining"
        # 25,000 vs expected 10,000 (50% of 20,000) → +150% → HIGH
        assert f.severity == InsightSeverity.HIGH
        keys = {e.key for e in f.evidence}
        assert {"current_spend", "baseline_avg", "relative_change"} <= keys
        assert any(a.kind.value == "RUN_SCENARIO" for a in f.actions)

    def test_small_change_ignored(self):
        today = date.today()
        current = _month(
            today.year, today.month, Decimal("10500"), {"cat-1": Decimal("10500")}
        )
        current.elapsed_ratio = Decimal("0.5")
        baseline = [
            _month(today.year, m, Decimal("20000"), {"cat-1": Decimal("20000")})
            for m in range(max(1, today.month - 3), today.month)
        ]
        ctx = _ctx(current_month=current, baseline_months=baseline)
        assert spending.detect(ctx) == []

    def test_no_baseline_no_finding(self):
        today = date.today()
        current = _month(
            today.year, today.month, Decimal("50000"), {"cat-1": Decimal("50000")}
        )
        ctx = _ctx(current_month=current, baseline_months=[])
        assert spending.detect(ctx) == []


# ── Budget risk ──────────────────────────────────────────────────────────


class TestBudgetRisk:
    def _ctx_with_budget(self, spent: Decimal, limit: Decimal, elapsed="0.5"):
        today = date.today()
        current = _month(
            today.year, today.month, spent, {"cat-1": spent}, count=6
        )
        current.elapsed_ratio = Decimal(elapsed)
        return _ctx(
            current_month=current,
            budgets=[
                {
                    "id": "b-1",
                    "category_id": "cat-1",
                    "category_name": "Dining",
                    "monthly_limit": limit,
                    "period": "monthly",
                    "updated_at": None,
                }
            ],
        )

    def test_over_budget_is_high(self):
        findings = budget.detect(self._ctx_with_budget(Decimal("12000"), Decimal("10000")))
        assert findings[0].severity == InsightSeverity.HIGH
        assert any(a.kind.value == "PREVIEW_ACTION" for a in findings[0].actions)
        assert any(a.kind.value == "RUN_SCENARIO" for a in findings[0].actions)

    def test_nearing_limit_is_medium(self):
        findings = budget.detect(self._ctx_with_budget(Decimal("9000"), Decimal("10000")))
        assert findings[0].severity == InsightSeverity.MEDIUM

    def test_under_threshold_no_finding(self):
        assert budget.detect(self._ctx_with_budget(Decimal("4000"), Decimal("10000"))) == []

    def test_projection_only_after_min_elapsed(self):
        ctx = self._ctx_with_budget(Decimal("6000"), Decimal("10000"), elapsed="0.1")
        findings = budget.detect(ctx)
        # 60% used at 10% elapsed → projected 60,000 → still surfaces as LOW
        # via projection… wait: projection requires elapsed ≥ 0.20, so with
        # 0.1 no projection is computed and util 0.6 < 0.70 → no finding.
        assert findings == []


# ── Cash-flow risk ──────────────────────────────────────────────────────


class TestCashflowRisk:
    def test_deficit(self):
        ctx = _ctx(
            monthly_income=Decimal("50000"),
            avg_monthly_expenses=Decimal("60000"),
        )
        findings = cashflow.detect(ctx)
        assert len(findings) == 1
        # 10k deficit = 20% of income → HIGH
        assert findings[0].severity == InsightSeverity.HIGH
        assert findings[0].impact.change == pytest.approx(-10000.0)

    def test_thin_surplus(self):
        ctx = _ctx(
            monthly_income=Decimal("100000"),
            avg_monthly_expenses=Decimal("98000"),
        )
        findings = cashflow.detect(ctx)
        assert findings[0].severity == InsightSeverity.LOW

    def test_healthy_surplus_no_finding(self):
        ctx = _ctx(
            monthly_income=Decimal("100000"),
            avg_monthly_expenses=Decimal("50000"),
        )
        assert cashflow.detect(ctx) == []

    def test_missing_income_no_finding(self):
        ctx = _ctx(avg_monthly_expenses=Decimal("50000"))
        assert cashflow.detect(ctx) == []


# ── Goal delay ───────────────────────────────────────────────────────────


class TestGoalDelay:
    def _ctx_goals(self, pace: Decimal):
        return _ctx(
            monthly_income=Decimal("100000"),
            avg_monthly_expenses=Decimal("100000") - pace,
            goals=[
                {
                    "id": str(uuid.uuid4()),
                    "goal_name": "Bike",
                    "target_amount": 200000,
                    "current_amount": 0,
                    "target_date": date(2027, 1, 1),
                    "status": "Active",
                }
            ],
        )

    def test_behind_goal(self):
        ctx = self._ctx_goals(Decimal("2000"))  # needs way more per month
        findings = goals.detect(ctx)
        assert len(findings) == 1
        f = findings[0]
        assert f.insight_type == InsightType.GOAL_DELAY
        assert f.severity in (InsightSeverity.MEDIUM, InsightSeverity.HIGH)
        assert any(
            a.kind.value == "RUN_SCENARIO" and a.scenario is not None
            and a.scenario.scenario_type == "GOAL_CONTRIBUTION_CHANGE"
            for a in f.actions
        )

    def test_on_track_no_finding(self):
        ctx = self._ctx_goals(Decimal("100000"))
        assert goals.detect(ctx) == []

    def test_no_surplus_no_finding(self):
        ctx = _ctx(goals=[{"goal_name": "x"}])
        assert goals.detect(ctx) == []


# ── Debt opportunity ─────────────────────────────────────────────────────


class TestDebtOpportunity:
    def test_high_interest_loan(self):
        ctx = _ctx(
            loans=[
                {
                    "id": str(uuid.uuid4()),
                    "name": "Personal Loan",
                    "liability_type": "Personal Loan",
                    "amount": 300000,
                    "interest_rate": 14.5,
                    "emi": 12000,
                }
            ]
        )
        findings = debt.detect(ctx)
        assert len(findings) == 1
        f = findings[0]
        assert f.severity == InsightSeverity.MEDIUM
        assert any(
            a.kind.value == "RUN_SCENARIO"
            and a.scenario.scenario_type == "LOAN_PREPAYMENT"
            for a in f.actions
        )
        keys = {e.key for e in f.evidence}
        assert {"outstanding", "interest_rate", "emi"} <= keys

    def test_low_rate_ignored(self):
        ctx = _ctx(
            loans=[
                {
                    "id": str(uuid.uuid4()),
                    "name": "Home Loan",
                    "amount": 3000000,
                    "interest_rate": 8.5,
                    "emi": 30000,
                }
            ]
        )
        assert debt.detect(ctx) == []

    def test_missing_rate_skipped(self):
        ctx = _ctx(
            loans=[{"id": "x", "name": "Loan", "amount": 500000}]
        )
        assert debt.detect(ctx) == []


# ── Emergency fund ───────────────────────────────────────────────────────


class TestEmergencyFund:
    def test_low_runway(self):
        ctx = _ctx(
            emergency_fund=Decimal("50000"),
            savings_total=Decimal("50000"),
            avg_monthly_expenses=Decimal("40000"),
        )
        findings = emergency_fund.detect(ctx)
        assert findings[0].severity == InsightSeverity.HIGH  # 1.25mo < 3mo

    def test_adequate_fund_no_finding(self):
        ctx = _ctx(
            emergency_fund=Decimal("300000"),
            avg_monthly_expenses=Decimal("40000"),
        )
        assert emergency_fund.detect(ctx) == []

    def test_no_expense_data_no_finding(self):
        ctx = _ctx(emergency_fund=Decimal("50000"))
        assert emergency_fund.detect(ctx) == []


# ── Tax opportunity ──────────────────────────────────────────────────────


class TestTaxOpportunity:
    def test_regime_saving(self):
        # ₹18L income, user on "old" while "new" is cheaper → opportunity.
        ctx = _ctx(
            annual_income=Decimal("1800000"),
            tax_profile={
                "tax_regime": "old",
                "annual_income": 1800000,
                "deduction_80c": 150000,
                "deduction_80d": 50000,
                "nps_deduction": 50000,
            },
        )
        findings = tax.detect(ctx)
        assert len(findings) == 1
        f = findings[0]
        assert f.insight_type == InsightType.TAX_OPPORTUNITY
        assert f.severity in (InsightSeverity.LOW, InsightSeverity.MEDIUM)
        assert "new" in f.summary

    def test_already_optimal_regime_no_finding(self):
        ctx = _ctx(
            annual_income=Decimal("1800000"),
            tax_profile={
                "tax_regime": "new",
                "annual_income": 1800000,
                "deduction_80c": 150000,
                "deduction_80d": 50000,
                "nps_deduction": 50000,
            },
        )
        assert tax.detect(ctx) == []

    def test_missing_profile_emits_gap_insight(self):
        ctx = _ctx(
            annual_income=Decimal("1200000"),
            tax_profile=None,
        )
        findings = tax.detect(ctx)
        assert len(findings) == 1
        assert findings[0].data_quality == DataAvailability.MISSING
        assert findings[0].severity == InsightSeverity.INFO

    def test_no_income_no_finding(self):
        ctx = _ctx(tax_profile={"annual_income": 1800000})
        ctx.annual_income = None
        assert tax.detect(ctx) == []


# ── Recurring cost ───────────────────────────────────────────────────────


class _Row:
    def __init__(self, desc, amount, category_id, days_ago, flagged=False):
        self.description = desc
        self.amount = amount
        self.category_id = category_id
        self.is_recurring = flagged
        self.expense_date = date.today().toordinal() - days_ago
        self.expense_date = date.fromordinal(self.expense_date)
        self.updated_at = datetime.now(timezone.utc)


class TestRecurringCost:
    def test_repeated_charge_detected(self):
        rows = [
            _Row("Netflix", 649, "cat-1", d)
            for d in (5, 35, 65, 95)
        ]
        ctx = _ctx(recurring_rows=rows)
        findings = recurring.detect(ctx)
        assert len(findings) == 1
        f = findings[0]
        assert f.insight_type == InsightType.RECURRING_COST
        assert f.severity == InsightSeverity.INFO
        assert f.entity_name == "Netflix"

    def test_single_charge_never_recurring(self):
        ctx = _ctx(recurring_rows=[_Row("Netflix", 649, "cat-1", 5)])
        assert recurring.detect(ctx) == []

    def test_variable_amounts_unflagged_ignored(self):
        rows = [
            _Row("Zomato", a, "cat-1", d)
            for a, d in [(200, 5), (900, 35), (450, 65)]
        ]
        ctx = _ctx(recurring_rows=rows)
        assert recurring.detect(ctx) == []


# ── Net worth change ─────────────────────────────────────────────────────


class TestNetWorthChange:
    def _hist(self, latest: float, previous: float, gap_days=10):
        today = date.today()
        return [
            {
                "snapshot_date": today,
                "net_worth": Decimal(str(latest)),
                "total_assets": Decimal(str(latest + 100000)),
                "total_liabilities": Decimal("100000"),
            },
            {
                "snapshot_date": date.fromordinal(today.toordinal() - gap_days),
                "net_worth": Decimal(str(previous)),
                "total_assets": Decimal(str(previous + 100000)),
                "total_liabilities": Decimal("100000"),
            },
        ]

    def test_material_drop(self):
        ctx = _ctx(net_worth_history=self._hist(400000, 500000))
        findings = net_worth.detect(ctx)
        assert len(findings) == 1
        assert findings[0].severity == InsightSeverity.MEDIUM  # -20%
        assert findings[0].impact.change == pytest.approx(-100000.0)

    def test_material_gain_is_info(self):
        ctx = _ctx(net_worth_history=self._hist(600000, 500000))
        findings = net_worth.detect(ctx)
        assert findings[0].severity == InsightSeverity.INFO

    def test_small_change_ignored(self):
        ctx = _ctx(net_worth_history=self._hist(505000, 500000))
        assert net_worth.detect(ctx) == []

    def test_single_snapshot_no_finding(self):
        today = date.today()
        ctx = _ctx(
            net_worth_history=[
                {
                    "snapshot_date": today,
                    "net_worth": Decimal("500000"),
                    "total_assets": Decimal("600000"),
                    "total_liabilities": Decimal("100000"),
                }
            ]
        )
        assert net_worth.detect(ctx) == []
