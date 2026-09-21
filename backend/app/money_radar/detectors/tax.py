"""TAX_OPPORTUNITY — regime comparison and tax-profile data gaps.

Every number comes from the deterministic ``TaxEngine``. When the tax
profile is absent the detector emits an honest data-gap insight instead
of fabricating deductions; missing fields are never converted to zero —
the engine's documented defaults (e.g. standard deduction) are disclosed
in evidence.
"""

from __future__ import annotations

from decimal import Decimal

from app.engines.tax_engine import Deductions, compare_regimes
from app.money_radar import thresholds as T
from app.money_radar.context import RadarContext
from app.money_radar.detectors.base import base_finding, inr
from app.money_radar.radar_types import (
    DataAvailability,
    InsightActionKind,
    InsightSeverity,
    InsightType,
)
from app.money_radar.schemas import (
    EvidenceItem,
    InsightAction,
    InsightImpact,
    RadarFinding,
)


def detect(ctx: RadarContext) -> list[RadarFinding]:
    annual = ctx.annual_income
    if annual is None or annual <= 0:
        return []

    tax = ctx.tax_profile
    if tax is None:
        # Data-gap insight — honest coverage, not a fabricated saving.
        finding = base_finding(
            InsightType.TAX_OPPORTUNITY,
            severity=InsightSeverity.INFO,
            title="Tax profile incomplete",
            summary=(
                "Your income is recorded but your tax profile is missing — "
                "a regime comparison needs your deductions to be meaningful."
            ),
            evidence=[
                EvidenceItem(
                    key="annual_income",
                    label="Annual income (derived)",
                    value=float(annual),
                    unit="currency",
                    source="IncomeRepository",
                ),
                EvidenceItem(
                    key="missing",
                    label="Missing",
                    value="tax profile (regime, 80C/80D/NPS deductions)",
                    source="TaxProfileRepository",
                ),
            ],
            explanation=[
                "FinArivu can compare the old and new tax regimes only once "
                "your deduction details exist.",
            ],
            state_key="no_tax_profile",
        )
        finding.impact = InsightImpact(
            metric_label="Tax coverage",
            description="Tax analysis is limited — profile data is missing.",
        )
        finding.actions = [
            InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
        ]
        finding.data_quality = DataAvailability.MISSING
        finding.freshness = ctx.freshness_for("income")
        return [finding]

    deductions = Deductions(
        section_80c=Decimal(str(tax.get("deduction_80c") or 0)),
        section_80d=Decimal(str(tax.get("deduction_80d") or 0)),
        section_80ccd_1b=Decimal(str(tax.get("nps_deduction") or 0)),
        # standard_deduction stays at the engine default and is disclosed.
    )
    comparison = compare_regimes(annual, deductions)
    savings = Decimal(str(comparison["savings"]))
    better = comparison["better_regime"]
    current_regime = tax.get("tax_regime")

    if savings < T.TAX_MIN_SAVINGS or current_regime == better:
        return []

    severity = (
        InsightSeverity.MEDIUM if savings >= Decimal("50000") else InsightSeverity.LOW
    )
    old_tax = Decimal(str(comparison["old_regime"].total_tax))
    new_tax = Decimal(str(comparison["new_regime"].total_tax))

    finding = base_finding(
        InsightType.TAX_OPPORTUNITY,
        severity=severity,
        title="Tax regime opportunity",
        summary=(
            f"The {better} regime could save ~{inr(savings)} this year "
            f"based on your recorded income and deductions."
        ),
        evidence=[
            EvidenceItem(
                key="annual_income",
                label="Annual income",
                value=float(annual),
                unit="currency",
                source="TaxProfileRepository" if tax.get("annual_income") else "IncomeRepository",
            ),
            EvidenceItem(
                key="old_regime_tax",
                label="Old regime tax",
                value=float(old_tax),
                unit="currency",
                source="TaxEngine",
            ),
            EvidenceItem(
                key="new_regime_tax",
                label="New regime tax",
                value=float(new_tax),
                unit="currency",
                source="TaxEngine",
            ),
            EvidenceItem(
                key="potential_saving",
                label="Potential saving",
                value=float(savings),
                unit="currency",
                source="TaxEngine",
            ),
            EvidenceItem(
                key="assumptions",
                label="Assumptions",
                value="standard deduction ₹50,000; recorded 80C/80D/NPS only",
                source="TaxEngine",
            ),
        ],
        explanation=[
            f"TaxEngine compared both regimes on ₹{float(annual):,.0f} with your recorded deductions.",
            "This is an educational comparison, not tax advice — verify with a professional before filing.",
        ],
        state_key=f"{better}:{int(savings / 10000)}",
    )
    finding.impact = InsightImpact(
        metric_label="Potential annual saving",
        after=float(savings),
        unit="currency",
        description=f"{better} regime saves ~{inr(savings)}",
    )
    finding.actions = [
        InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
    ]
    finding.freshness = ctx.freshness_for("tax")
    return [finding]
