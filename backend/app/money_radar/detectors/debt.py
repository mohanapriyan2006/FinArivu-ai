"""DEBT_OPPORTUNITY — high-interest loans where prepayment may cut interest.

Only fires when the liability record carries the fields needed to reason
honestly (outstanding amount, annual interest rate). Amortisation math
reuses ``app.scenarios.calculations`` — the same functions Phase 2 uses.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_FLOOR

from app.money_radar import thresholds as T
from app.money_radar.context import RadarContext
from app.money_radar.detectors.base import base_finding, inr
from app.money_radar.radar_types import (
    InsightActionKind,
    InsightSeverity,
    InsightType,
)
from app.money_radar.schemas import (
    EvidenceItem,
    InsightAction,
    InsightImpact,
    RadarFinding,
    ScenarioPreset,
)
from app.scenarios import calculations as calc


def _suggested_prepayment(principal: Decimal) -> Decimal:
    """10% of outstanding, rounded down to the nearest ₹5,000."""
    raw = (principal * T.DEBT_PREPAYMENT_SHARE / T.DEBT_PREPAYMENT_ROUND).to_integral_value(
        rounding=ROUND_FLOOR
    ) * T.DEBT_PREPAYMENT_ROUND
    suggested = max(raw, T.DEBT_PREPAYMENT_MIN)
    return min(suggested, principal)


def detect(ctx: RadarContext) -> list[RadarFinding]:
    findings: list[RadarFinding] = []
    for loan in ctx.loans:
        principal = Decimal(str(loan.get("amount") or 0))
        rate_pct = loan.get("interest_rate")
        if rate_pct is None:
            continue  # cannot reason about interest without the rate
        rate = Decimal(str(rate_pct))
        if principal < T.DEBT_MIN_PRINCIPAL or rate < T.DEBT_MIN_INTEREST_RATE_PCT:
            continue

        emi = Decimal(str(loan.get("emi") or 0))
        monthly_rate = rate / 100 / 12
        months = None
        interest_burden = None
        if emi > 0:
            months = calc.loan_months_to_close(principal, monthly_rate, emi)
            if months is None and loan.get("remaining_tenure_months"):
                months = Decimal(str(loan["remaining_tenure_months"]))
            if months is not None:
                total = calc.loan_total_cost(principal, monthly_rate, emi, months)
                if total is not None:
                    interest_burden = total - principal
        elif loan.get("remaining_tenure_months"):
            months = Decimal(str(loan["remaining_tenure_months"]))

        if rate >= Decimal("18"):
            severity = InsightSeverity.HIGH
        elif rate >= Decimal("14"):
            severity = InsightSeverity.MEDIUM
        else:
            severity = InsightSeverity.LOW

        name = loan.get("name") or loan.get("liability_type") or "Loan"
        prepayment = _suggested_prepayment(principal)

        evidence = [
            EvidenceItem(
                key="outstanding",
                label="Outstanding principal",
                value=float(principal),
                unit="currency",
                source="LiabilityRepository",
            ),
            EvidenceItem(
                key="interest_rate",
                label="Annual interest rate",
                value=float(rate),
                unit="percent",
                source="LiabilityRepository",
            ),
        ]
        if emi > 0:
            evidence.append(
                EvidenceItem(
                    key="emi",
                    label="Monthly EMI",
                    value=float(emi),
                    unit="currency",
                    source="LiabilityRepository",
                )
            )
        if months is not None:
            evidence.append(
                EvidenceItem(
                    key="months_to_close",
                    label="Months to close",
                    value=float(months),
                    unit="months",
                    source="ScenarioEngine",
                )
            )
        if interest_burden is not None and interest_burden > 0:
            evidence.append(
                EvidenceItem(
                    key="interest_burden",
                    label="Remaining interest",
                    value=float(interest_burden),
                    unit="currency",
                    source="ScenarioEngine",
                )
            )

        finding = base_finding(
            InsightType.DEBT_OPPORTUNITY,
            severity=severity,
            title=f"{name} prepayment opportunity",
            summary=(
                f"{name} carries {rate:.1f}% interest on {inr(principal)}"
                + (
                    f" — roughly {inr(interest_burden)} interest remains."
                    if interest_burden is not None and interest_burden > 0
                    else "."
                )
                + " A prepayment may reduce the total cost — simulate it first."
            ),
            entity_id=str(loan.get("id")) if loan.get("id") else None,
            entity_name=name,
            evidence=evidence,
            explanation=[
                f"Interest above {T.DEBT_MIN_INTEREST_RATE_PCT}% APR on a meaningful balance is usually worth simulating a prepayment.",
                "The Scenario Lab compares your exact loan terms — nothing changes unless you confirm it.",
            ],
            state_key=f"{loan.get('id')}:{severity.value}:{int(principal / 10000)}",
        )
        finding.impact = InsightImpact(
            metric_label="Remaining interest",
            after=float(interest_burden) if interest_burden is not None else None,
            unit="currency",
            description=f"{rate:.1f}% APR on {inr(principal)}",
        )
        finding.actions = [
            InsightAction(
                kind=InsightActionKind.RUN_SCENARIO,
                label=f"Simulate {inr(prepayment)} prepayment",
                scenario=ScenarioPreset(
                    scenario_type="LOAN_PREPAYMENT",
                    parameters={
                        "loan_id": str(loan.get("id")),
                        "prepayment_amount": float(prepayment),
                    },
                    title=f"{name} prepay {inr(prepayment)}",
                ),
            ),
            InsightAction(
                kind=InsightActionKind.VIEW, label="View loan", route="loans"
            ),
            InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
        ]
        finding.freshness = ctx.freshness_for("liabilities")
        findings.append(finding)

    return findings
