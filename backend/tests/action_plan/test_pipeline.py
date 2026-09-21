"""Phase 4 pipeline tests — CandidateBuilder, PriorityPolicy, PlanSelector.

All pure functions on synthetic RadarInsight objects — no database.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.money_radar.radar_types import (
    DataAvailability,
    FreshnessStatus,
    InsightActionKind,
    InsightSeverity,
    InsightStatus,
    InsightType,
)
from app.money_radar.schemas import (
    ActionIntent,
    DataFreshness,
    EvidenceItem,
    InsightAction,
    InsightImpact,
    InsightSource,
    RadarInsight,
    ScenarioPreset,
)
from app.action_plan.pipeline import (
    CandidateBuilder,
    PlanSelector,
    PriorityPolicy,
    current_period,
    resolve_snooze,
)
from app.action_plan.plan_types import PlanItemPriority, SnoozeOption
from app.action_plan.schemas import PlanItemAction


def _insight(
    insight_type: InsightType = InsightType.BUDGET_RISK,
    severity: InsightSeverity = InsightSeverity.HIGH,
    actions: list[InsightAction] | None = None,
    data_quality: DataAvailability = DataAvailability.AVAILABLE,
    freshness: FreshnessStatus = FreshnessStatus.FRESH,
    entity_name: str = "Dining",
    impact_change=None,
) -> RadarInsight:
    if actions is None:
        actions = [
            InsightAction(
                kind=InsightActionKind.RUN_SCENARIO,
                label="Simulate",
                scenario=ScenarioPreset(
                    scenario_type="BUDGET_CHANGE", parameters={"x": 1}
                ),
            ),
            InsightAction(kind=InsightActionKind.VIEW, label="View", route="budget"),
        ]
    return RadarInsight(
        id=uuid.uuid4(),
        insight_type=insight_type,
        status=InsightStatus.ACTIVE,
        severity=severity,
        category="budget",
        title="t",
        summary="s",
        entity_name=entity_name,
        evidence=[EvidenceItem(key="k", label="l", value=1)],
        impact=InsightImpact(change=impact_change),
        explanation=["e"],
        actions=actions,
        source=InsightSource(detector="budget_risk", detector_version="v1"),
        data_quality=data_quality,
        freshness=DataFreshness(
            updated_at=datetime.now(timezone.utc), age_days=0, status=freshness
        ),
        detector_version="v1",
        generated_at=datetime.now(timezone.utc),
    )


class TestPriorityPolicy:
    def test_high_severity_actionable_scores_high(self):
        insight = _insight(severity=InsightSeverity.HIGH)
        score = PriorityPolicy.score(insight)
        assert score >= 45
        assert PriorityPolicy.band(score) == PlanItemPriority.HIGH

    def test_info_severity_scores_low(self):
        insight = _insight(
            insight_type=InsightType.RECURRING_COST,
            severity=InsightSeverity.INFO,
            actions=[
                InsightAction(kind=InsightActionKind.VIEW, label="v", route="expenses")
            ],
        )
        score = PriorityPolicy.score(insight)
        assert PriorityPolicy.band(score) == PlanItemPriority.LOW

    def test_dismissal_penalty(self):
        insight = _insight(severity=InsightSeverity.MEDIUM)
        clean = PriorityPolicy.score(insight)
        penalised = PriorityPolicy.score(insight, dismissal_count=2)
        assert penalised < clean

    def test_stale_data_penalised(self):
        fresh = _insight(freshness=FreshnessStatus.FRESH)
        stale = _insight(freshness=FreshnessStatus.STALE)
        assert PriorityPolicy.score(stale) < PriorityPolicy.score(fresh)

    def test_missing_data_zeroed(self):
        insight = _insight(data_quality=DataAvailability.MISSING)
        assert PriorityPolicy.score(insight) <= 0


class TestCandidateBuilder:
    def test_maps_insight_to_candidate(self):
        user = uuid.uuid4()
        candidates = CandidateBuilder.from_insights(user, [_insight()], {})
        assert len(candidates) == 1
        cand = candidates[0]
        assert cand.category.value == "REVIEW_BUDGET"
        assert cand.source_insight_type == "BUDGET_RISK"
        assert cand.scenario_preset is not None
        assert cand.route == "budget"
        assert PlanItemAction.SIMULATE in cand.actions
        assert PlanItemAction.COMPLETE in cand.actions
        assert cand.fingerprint

    def test_info_insight_without_actions_skipped(self):
        user = uuid.uuid4()
        insight = _insight(
            insight_type=InsightType.TAX_OPPORTUNITY,
            actions=[InsightAction(kind=InsightActionKind.EXPLAIN, label="w")],
        )
        assert CandidateBuilder.from_insights(user, [insight], {}) == []

    def test_missing_quality_skipped(self):
        user = uuid.uuid4()
        insight = _insight(data_quality=DataAvailability.UNSUPPORTED)
        assert CandidateBuilder.from_insights(user, [insight], {}) == []

    def test_non_active_insights_skipped(self):
        user = uuid.uuid4()
        insight = _insight()
        insight.status = InsightStatus.RESOLVED
        assert CandidateBuilder.from_insights(user, [insight], {}) == []

    def test_dedupes_identical_fingerprints(self):
        user = uuid.uuid4()
        i1 = _insight()
        i1.id = uuid.UUID(int=1)
        i2 = _insight()
        i2.id = uuid.UUID(int=1)  # same id → same fingerprint
        candidates = CandidateBuilder.from_insights(user, [i1, i2], {})
        assert len(candidates) == 1


class TestPlanSelector:
    def _cand(self, category, score, title="t"):
        from app.action_plan.schemas import PlanCandidate
        from app.action_plan.plan_types import PlanItemCategory, PlanItemSource

        return PlanCandidate(
            category=PlanItemCategory(category),
            source_type=PlanItemSource.RADAR,
            title=title,
            summary="s",
            score=score,
        )

    def test_selects_top_scored(self):
        cands = [
            self._cand("REVIEW_BUDGET", 60),
            self._cand("REPLAN_GOAL", 40),
            self._cand("REVIEW_TAX", 30),
        ]
        out = PlanSelector.select(cands)
        assert [c.score for c in out] == [60, 40, 30]

    def test_caps_at_five(self):
        cands = [
            self._cand("REVIEW_BUDGET", 90),
            self._cand("REPLAN_GOAL", 80),
            self._cand("REVIEW_DEBT", 70),
            self._cand("BUILD_RESERVE", 60),
            self._cand("REVIEW_TAX", 50),
            self._cand("REVIEW_NETWORTH", 40),
        ]
        assert len(PlanSelector.select(cands)) == 5

    def test_diversity_caps_group(self):
        """Three spending-group candidates can't crowd out everything."""
        cands = [
            self._cand("REVIEW_BUDGET", 90),
            self._cand("REVIEW_SPENDING", 85),
            self._cand("REVIEW_RECURRING_COST", 80),  # third in 'spending'
            self._cand("REPLAN_GOAL", 40),
        ]
        out = PlanSelector.select(cands, max_items=5)
        cats = [c.category.value for c in out]
        assert "REVIEW_RECURRING_COST" not in cats
        assert "REPLAN_GOAL" in cats

    def test_allows_fewer_than_three(self):
        assert len(PlanSelector.select([self._cand("REVIEW_TAX", 30)])) == 1
        assert PlanSelector.select([]) == []


class TestPeriodAndSnooze:
    def test_current_period_is_iso_week(self):
        key, start, end = current_period()
        assert start.weekday() == 0  # Monday
        assert end.weekday() == 6    # Sunday
        assert (end - start).days == 6
        assert key.startswith(f"{start.isocalendar().year}-W")

    def test_snooze_resolution(self):
        now = datetime(2026, 9, 21, 10, 0, tzinfo=timezone.utc)  # Monday
        assert resolve_snooze("LATER_TODAY", now) > now
        tomorrow = resolve_snooze("TOMORROW", now)
        assert (tomorrow - now).days == 1
        nxt = resolve_snooze("NEXT_WEEK", now)
        assert nxt.weekday() == 0
        assert nxt.date() > now.date()

    def test_snooze_option_enum(self):
        assert SnoozeOption.LATER_TODAY.value == "LATER_TODAY"
