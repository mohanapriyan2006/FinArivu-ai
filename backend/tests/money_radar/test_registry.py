"""Registry integrity — every declared type is wired end to end."""

from __future__ import annotations

from app.money_radar.detectors import DETECTOR_FUNCS
from app.money_radar.radar_types import DETECTOR_VERSIONS, InsightType
from app.money_radar.registry import (
    INSIGHT_REGISTRY,
    domains_for_detectors,
    get_insight_definition,
)


def test_every_type_registered() -> None:
    for t in InsightType:
        assert t in INSIGHT_REGISTRY, f"{t} missing from INSIGHT_REGISTRY"
        assert t in DETECTOR_VERSIONS, f"{t} missing a detector version"


def test_every_definition_has_detector() -> None:
    for t, d in INSIGHT_REGISTRY.items():
        assert d.detector in DETECTOR_FUNCS, f"{t}: no detector '{d.detector}'"
        assert d.required_domains, f"{t}: no required domains declared"
        assert d.detector_version


def test_detector_keys_match() -> None:
    assert set(domains_for_detectors()) == {
        d.detector for d in INSIGHT_REGISTRY.values()
    }


def test_lookup_by_string_and_enum() -> None:
    assert get_insight_definition("SPENDING_SPIKE") is not None
    assert get_insight_definition(InsightType.BUDGET_RISK) is not None
    assert get_insight_definition("NOT_A_THING") is None


def test_action_kinds_are_typed() -> None:
    for d in INSIGHT_REGISTRY.values():
        assert d.action_kinds, f"{d.type}: no actions declared"
