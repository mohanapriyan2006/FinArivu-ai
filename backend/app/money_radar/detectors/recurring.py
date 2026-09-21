"""RECURRING_COST — repeated charges identified from real expense rows.

A charge only counts as recurring with repeated evidence: ≥3 occurrences
inside the window for unflagged patterns, ≥2 for user-flagged recurring
rows (the flag is itself user-declared evidence). Rows without a
description are only clustered when explicitly marked recurring — a bare
category total is never called a subscription.
"""

from __future__ import annotations

import re
from decimal import Decimal
from itertools import groupby

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
)


def _normalise(text: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def detect(ctx: RadarContext) -> list[RadarFinding]:
    rows = ctx.recurring_rows
    if not rows:
        return []

    clusters: dict[tuple[str, str], list] = {}
    for row in rows:
        desc = _normalise(row.description)
        flagged = bool(row.is_recurring)
        if not desc and not flagged:
            continue
        key = (str(row.category_id), desc or f"flagged:{row.category_id}")
        clusters.setdefault(key, []).append(row)

    candidates: list[tuple[tuple[str, str], list, Decimal, bool]] = []
    for key, items in clusters.items():
        flagged = any(r.is_recurring for r in items)
        min_occ = 2 if flagged else T.RECURRING_MIN_OCCURRENCES
        if len(items) < min_occ:
            continue
        amounts = [Decimal(str(r.amount)) for r in items]
        avg = sum(amounts, Decimal("0")) / len(amounts)
        if avg < T.RECURRING_MIN_AVG_AMOUNT:
            continue
        consistent = all(
            abs(a - avg) <= avg * T.RECURRING_AMOUNT_TOLERANCE for a in amounts
        )
        if not flagged and not consistent:
            continue  # variable amounts without a flag — not a fixed charge
        candidates.append((key, items, avg, consistent))

    # Rank by approximate monthly cost (avg × occurrences / months in window).
    months_in_window = Decimal(str(T.RECURRING_WINDOW_DAYS)) / 30
    candidates.sort(
        key=lambda c: c[2] * len(c[1]) / months_in_window, reverse=True
    )

    findings: list[RadarFinding] = []
    for (cat_id, desc), items, avg, consistent in candidates[: T.RECURRING_MAX_INSIGHTS]:
        name = items[0].description or ctx.category_names.get(cat_id, "Recurring")
        cat_name = ctx.category_names.get(cat_id, "Uncategorised")
        monthly_cost = avg * len(items) / months_in_window
        dates = sorted(r.expense_date for r in items)
        flagged = any(r.is_recurring for r in items)

        finding = base_finding(
            InsightType.RECURRING_COST,
            severity=InsightSeverity.INFO,
            title=f"Recurring cost: {name}",
            summary=(
                f"~{inr(monthly_cost)}/month on “{name}” — "
                f"{len(items)} charges in the last "
                f"{T.RECURRING_WINDOW_DAYS // 30} months."
            ),
            entity_id=cat_id,
            entity_name=name,
            evidence=[
                EvidenceItem(
                    key="label",
                    label="Charge",
                    value=name,
                    source="ExpenseRepository",
                ),
                EvidenceItem(
                    key="category",
                    label="Category",
                    value=cat_name,
                    source="ExpenseRepository",
                ),
                EvidenceItem(
                    key="occurrences",
                    label="Occurrences",
                    value=len(items),
                    unit="count",
                    source="ExpenseRepository",
                ),
                EvidenceItem(
                    key="avg_amount",
                    label="Average amount",
                    value=float(avg),
                    unit="currency",
                    source="ExpenseRepository",
                ),
                EvidenceItem(
                    key="monthly_cost",
                    label="Est. monthly cost",
                    value=float(monthly_cost),
                    unit="currency",
                ),
                EvidenceItem(
                    key="window",
                    label="Window",
                    value=f"{dates[0].isoformat()} → {dates[-1].isoformat()}",
                ),
                EvidenceItem(
                    key="flagged_recurring",
                    label="Marked recurring",
                    value=flagged,
                    source="ExpenseRepository",
                ),
            ],
            explanation=[
                (
                    "Detected from repeated charges with consistent amounts."
                    if consistent
                    else "Detected from repeated charges (amounts vary)."
                ),
                "Subscriptions and repeating bills are easy to forget — "
                "verify this is still a service you use.",
            ],
            state_key=f"{cat_id}:{desc}:{int(avg)}:{len(items)}",
        )
        finding.impact = InsightImpact(
            metric_label="Est. monthly cost",
            after=float(monthly_cost),
            unit="currency",
            description=f"{len(items)} charges averaging {inr(avg)}",
        )
        finding.actions = [
            InsightAction(
                kind=InsightActionKind.VIEW, label="View expenses", route="expenses"
            ),
            InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
        ]
        finding.freshness = ctx.freshness_for("expenses")
        findings.append(finding)

    return findings
