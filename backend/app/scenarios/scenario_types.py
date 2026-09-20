"""Canonical scenario vocabulary for the Scenario Lab.

``ScenarioType`` is the single source of truth for what-if scenario kinds.
A type only appears in ``SCENARIO_REGISTRY`` when its deterministic
calculation is actually implemented — the enum alone never exposes a
scenario.
"""

from __future__ import annotations

from enum import Enum


class ScenarioType(str, Enum):
    INCOME_CHANGE = "INCOME_CHANGE"
    EXPENSE_CHANGE = "EXPENSE_CHANGE"
    CATEGORY_SPENDING_CHANGE = "CATEGORY_SPENDING_CHANGE"
    BUDGET_CHANGE = "BUDGET_CHANGE"
    MONTHLY_SAVINGS_CHANGE = "MONTHLY_SAVINGS_CHANGE"
    GOAL_CONTRIBUTION_CHANGE = "GOAL_CONTRIBUTION_CHANGE"
    GOAL_TARGET_CHANGE = "GOAL_TARGET_CHANGE"
    GOAL_DEADLINE_CHANGE = "GOAL_DEADLINE_CHANGE"
    PURCHASE = "PURCHASE"
    RETIREMENT_AGE_CHANGE = "RETIREMENT_AGE_CHANGE"
    INFLATION_CHANGE = "INFLATION_CHANGE"
    LOAN_PREPAYMENT = "LOAN_PREPAYMENT"
    LOAN_EMI_CHANGE = "LOAN_EMI_CHANGE"
    EMERGENCY_FUND_TARGET_CHANGE = "EMERGENCY_FUND_TARGET_CHANGE"


class ScenarioRunStatus(str, Enum):
    """Outcome of a scenario run — mirrors the wire contract."""

    COMPUTED = "COMPUTED"
    NEEDS_INPUT = "NEEDS_INPUT"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    NOT_SUPPORTED = "NOT_SUPPORTED"


class MetricDirection(str, Enum):
    """Deterministic change classification — never decided by the LLM."""

    IMPROVES = "IMPROVES"
    WORSENS = "WORSENS"
    UNCHANGED = "UNCHANGED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class MetricUnit(str, Enum):
    CURRENCY = "currency"
    PERCENT = "percent"
    MONTHS = "months"
    DATE = "date"
    SCORE = "score"
    COUNT = "count"


class DataQuality(str, Enum):
    COMPLETE = "complete"
    PARTIAL = "partial"
    INSUFFICIENT = "insufficient"


class ScenarioErrorCode(str, Enum):
    INVALID_SCENARIO = "INVALID_SCENARIO"
    INVALID_PARAMETERS = "INVALID_PARAMETERS"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    SCENARIO_NOT_FOUND = "SCENARIO_NOT_FOUND"
    ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND"
    AMBIGUOUS_ENTITY = "AMBIGUOUS_ENTITY"
    COMPARISON_LIMIT = "COMPARISON_LIMIT"
    SCENARIO_FAILED = "SCENARIO_FAILED"


ENGINE_VERSION = "scenario_engine_v1"
