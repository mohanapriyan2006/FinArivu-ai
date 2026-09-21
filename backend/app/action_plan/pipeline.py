"""Deterministic plan-generation pipeline (Phase 4 §11, §14, §57–§59).

    RadarSummary (active insights)
      → CandidateBuilder   — insight → PlanCandidate via the registry map
      → PriorityPolicy     — deterministic score → HIGH/MEDIUM/LOW band
      → PlanSelector       — top N with cross-domain diversity
      → PlanReconciler     — merge with existing rows, resolve stale items

No LLM participates anywhere in this module. Every score input is a typed
field on a persisted insight — never generated text.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import date, datetime, timedelta, timezone

from app.money_radar.radar_types import (
    DataAvailability,
    InsightActionKind,
    InsightSeverity,
    InsightType,
)
from app.money_radar.schemas import RadarInsight
from app.action_plan.mapping import blueprint_for
from app.action_plan.plan_types import (
    OPEN_ITEM_STATUSES,
    PLAN_MAX_ACTIVE_ITEMS,
    PlanItemCategory,
    PlanItemPriority,
    PlanItemSource,
    PlanItemStatus,
)
from app.action_plan.schemas import PlanCandidate, PlanItemAction


# ── Priority scoring (deterministic — §14) ────────────────────────────────

_SEVERITY_WEIGHT = {
    InsightSeverity.HIGH.value: 40.0,
    InsightSeverity.MEDIUM.value: 25.0,
    InsightSeverity.LOW.value: 12.0,
    InsightSeverity.INFO.value: 4.0,
}
_QUALITY_PENALTY = {
    DataAvailability.AVAILABLE.value: 0.0,
    DataAvailability.PARTIAL.value: 5.0,
    DataAvailability.STALE.value: 10.0,
    DataAvailability.MISSING.value: 100.0,   # never selectable
    DataAvailability.UNSUPPORTED.value: 100.0,
}
_FRESHNESS_PENALTY = {
    "FRESH": 0.0,
    "RECENT": 2.0,
    "STALE": 12.0,
    "UNKNOWN": 4.0,
}
_ACTIONABILITY_BONUS = {
    "PREVIEW_ACTION": 15.0,
    "RUN_SCENARIO": 10.0,
    "VIEW": 4.0,
}
# Score bands → displayed priority.
_HIGH_SCORE = 45.0
_MEDIUM_SCORE = 22.0


class PriorityPolicy:
    """Deterministic scoring — converts insight fields into a rank."""

    @staticmethod
    def score(insight: RadarInsight, *, dismissal_count: int = 0) -> float:
        score = _SEVERITY_WEIGHT.get(insight.severity.value, 0.0)

        # Financial impact: use the detector's headline |change| when it is
        # a number — capped so a giant value can't outrank everything.
        change = insight.impact.change
        if isinstance(change, (int, float)):
            magnitude = abs(float(change))
            score += min(magnitude / 5000.0, 15.0)   # +15 max at ₹75k delta

        # Actionability — the insight's own typed actions.
        kinds = {a.kind.value for a in insight.actions}
        score += max(
            (_ACTIONABILITY_BONUS.get(k, 0.0) for k in kinds), default=0.0
        )

        # Goal relevance — a delayed goal the user set is urgent for them.
        if insight.insight_type == InsightType.GOAL_DELAY:
            score += 8.0

        score -= _QUALITY_PENALTY.get(insight.data_quality.value, 20.0)
        score -= _FRESHNESS_PENALTY.get(insight.freshness.status.value, 4.0)

        # Anti-noise: repeated dismissals of the same signature.
        score -= min(dismissal_count * 15.0, 30.0)

        return max(score, 0.0)

    @staticmethod
    def band(score: float) -> PlanItemPriority:
        if score >= _HIGH_SCORE:
            return PlanItemPriority.HIGH
        if score >= _MEDIUM_SCORE:
            return PlanItemPriority.MEDIUM
        return PlanItemPriority.LOW


# ── Candidate builder ─────────────────────────────────────────────────────


class CandidateBuilder:
    """Map active radar insights to plan candidates — one per condition."""

    @staticmethod
    def from_insights(
        user_id: uuid.UUID,
        insights: list[RadarInsight],
        dismissed_signatures: dict[str, int],
    ) -> list[PlanCandidate]:
        candidates: list[PlanCandidate] = []
        seen_fp: set[str] = set()

        for insight in insights:
            if insight.status not in ("ACTIVE", "SEEN"):
                continue
            blueprint = blueprint_for(insight.insight_type.value)
            if blueprint is None:
                continue

            # Actionability filter (§16) — the insight must expose at least
            # one useful next step beyond pure explanation.
            actionable = {
                InsightActionKind.RUN_SCENARIO.value,
                InsightActionKind.PREVIEW_ACTION.value,
                InsightActionKind.VIEW.value,
            } & {a.kind.value for a in insight.actions}
            if not actionable:
                continue

            # Data-quality rule (§17) — never plan on missing/unsupported data.
            if insight.data_quality in (
                DataAvailability.MISSING,
                DataAvailability.UNSUPPORTED,
            ):
                continue

            signature = CandidateBuilder._signature(insight)
            dismissals = dismissed_signatures.get(signature, 0)
            score = PriorityPolicy.score(insight, dismissal_count=dismissals)
            if score <= 0:
                continue

            scenario, action_intent, route = CandidateBuilder._extract_actions(
                insight
            )
            actions = CandidateBuilder._plan_actions(scenario, action_intent, route)

            fingerprint = CandidateBuilder._fingerprint(
                user_id, insight, blueprint.category
            )
            if fingerprint in seen_fp:
                continue
            seen_fp.add(fingerprint)

            candidate = PlanCandidate(
                category=blueprint.category,
                source_type=PlanItemSource.RADAR,
                title=blueprint.default_title_template.replace(
                    "{entity}", insight.entity_name or "this"
                ),
                summary=insight.summary,
                priority=PriorityPolicy.band(score),
                score=score,
                source_insight_id=str(insight.id),
                source_insight_type=insight.insight_type.value,
                source_id=str(insight.id),
                entity_type=insight.entity_type,
                entity_id=insight.entity_id,
                entity_name=insight.entity_name,
                evidence=list(insight.evidence),
                impact=insight.impact,
                why=CandidateBuilder._why(insight),
                actions=actions,
                route=route,
                scenario_preset=scenario,
                action_preset=action_intent,
                due_window=CandidateBuilder._due_window(insight),
                data_quality=insight.data_quality.value,
                freshness=insight.freshness,
                state_signature=signature,
                fingerprint=fingerprint,
            )
            candidates.append(candidate)
        return candidates

    # ── helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _signature(insight: RadarInsight) -> str:
        """Anti-noise signature — insight type + entity identity."""
        return "|".join(
            [
                insight.insight_type.value,
                insight.entity_type or "",
                insight.entity_id or "",
            ]
        )

    @staticmethod
    def _fingerprint(
        user_id: uuid.UUID,
        insight: RadarInsight,
        category: PlanItemCategory,
    ) -> str:
        material = "|".join(
            [
                str(user_id),
                PlanItemSource.RADAR.value,
                str(insight.id),
                category.value,
                insight.entity_id or "",
            ]
        )
        return hashlib.sha256(material.encode("utf-8")).hexdigest()

    @staticmethod
    def _extract_actions(
        insight: RadarInsight,
    ) -> tuple:
        scenario = None
        action_intent = None
        route = None
        for action in insight.actions:
            if action.kind == InsightActionKind.RUN_SCENARIO and action.scenario:
                scenario = action.scenario if scenario is None else scenario
            elif (
                action.kind == InsightActionKind.PREVIEW_ACTION and action.action
            ):
                action_intent = (
                    action.action if action_intent is None else action_intent
                )
            elif action.kind == InsightActionKind.VIEW and action.route:
                route = action.route if route is None else route
        return scenario, action_intent, route

    @staticmethod
    def _plan_actions(scenario, action_intent, route) -> list[PlanItemAction]:
        out: list[PlanItemAction] = []
        if route:
            out.append(PlanItemAction.DO_NOW)
        if scenario is not None:
            out.append(PlanItemAction.SIMULATE)
        if action_intent is not None:
            out.append(PlanItemAction.PREVIEW_ACTION)
        out.extend([PlanItemAction.COMPLETE, PlanItemAction.SNOOZE,
                    PlanItemAction.DISMISS])
        return out

    @staticmethod
    def _due_window(insight: RadarInsight) -> str:
        if insight.severity == InsightSeverity.HIGH:
            return "TODAY"
        if insight.severity == InsightSeverity.MEDIUM:
            return "THIS_WEEK"
        return "NEXT_WEEK"

    @staticmethod
    def _why(insight: RadarInsight) -> list[str]:
        """Structured provenance for 'Why is this in my plan?' (§21)."""
        lines = [insight.summary]
        source = insight.source.detector.replace("_", " ") if insight.source else "radar"
        lines.append(f"Detected by Money Radar ({source}).")
        if insight.freshness.status.value != "FRESH":
            age = insight.freshness.age_days
            lines.append(
                f"Source data is {insight.freshness.status.value.lower()}"
                + (f" ({age}d old)." if age is not None else ".")
            )
        return lines


# ── Selector — top-N with cross-domain diversity (§59) ─────────────────────

# Diversity: at most this many items from one category group in the plan.
_GROUP_CAP = 2
_CATEGORY_GROUPS: dict[PlanItemCategory, str] = {
    PlanItemCategory.REVIEW_SPENDING: "spending",
    PlanItemCategory.REVIEW_BUDGET: "spending",
    PlanItemCategory.REVIEW_RECURRING_COST: "spending",
    PlanItemCategory.IMPROVE_CASHFLOW: "cashflow",
    PlanItemCategory.REPLAN_GOAL: "goals",
    PlanItemCategory.REVIEW_DEBT: "debt",
    PlanItemCategory.BUILD_RESERVE: "savings",
    PlanItemCategory.REVIEW_TAX: "tax",
    PlanItemCategory.REVIEW_NETWORTH: "networth",
    PlanItemCategory.COMPLETE_PROFILE: "profile",
}


class PlanSelector:
    """Pick the top plan items — score-ranked, category-diverse, ≤5."""

    @staticmethod
    def select(
        candidates: list[PlanCandidate],
        max_items: int = PLAN_MAX_ACTIVE_ITEMS,
    ) -> list[PlanCandidate]:
        ranked = sorted(candidates, key=lambda c: (-c.score, c.title))
        selected: list[PlanCandidate] = []
        group_counts: dict[str, int] = {}

        for cand in ranked:
            group = _CATEGORY_GROUPS.get(cand.category, "other")
            if group_counts.get(group, 0) >= _GROUP_CAP:
                continue
            selected.append(cand)
            group_counts[group] = group_counts.get(group, 0) + 1
            if len(selected) >= max_items:
                break
        return selected


# ── Reconciler ─────────────────────────────────────────────────────────────


class PlanReconciler:
    """Merge new candidates with the persisted plan — never rebuild.

    Rules (§30–§36, §131–§135):
      * item whose source insight resolved/left radar → EXPIRED
      * snoozed item past its window → PENDING if source still active
      * dismissed item stays dismissed (anti-noise signature check)
      * pending/in-progress items keep their state and get field refresh
      * genuinely new candidates become PENDING items
    """

    @staticmethod
    def is_transition_allowed(current: str, target: str) -> bool:
        from app.action_plan.plan_types import can_transition

        return can_transition(current, target)


def current_period(today: date | None = None) -> tuple[str, date, date]:
    """Centralised period resolver — ISO week (Mon–Sun). §32.

    One resolver so the period convention lives in exactly one place.
    """
    today = today or date.today()
    iso = today.isocalendar()
    period_key = f"{iso.year}-W{iso.week:02d}"
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)
    return period_key, start, end


def resolve_snooze(option: str, now: datetime | None = None) -> datetime:
    """Resolve a SnoozeOption to a concrete UTC timestamp (§96)."""
    from app.action_plan.plan_types import SnoozeOption

    now = now or datetime.now(timezone.utc)
    if option == SnoozeOption.LATER_TODAY.value:
        return now + timedelta(hours=8)
    if option == SnoozeOption.TOMORROW.value:
        return now + timedelta(days=1)
    # NEXT_WEEK → next Monday 00:00 UTC
    days_ahead = (7 - now.weekday()) % 7 or 7
    return (now + timedelta(days=days_ahead)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
