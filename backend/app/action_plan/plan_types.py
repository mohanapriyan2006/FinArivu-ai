"""Controlled vocabularies for the Financial Action Plan (Phase 4).

Money Radar decides *what changed*; this layer decides *what to do about
it*. Every status, priority, category and error code is a typed enum — the
LLM never picks a priority, invents an impact number, or decides whether a
plan item exists.
"""

from __future__ import annotations

from enum import Enum


class PlanStatus(str, Enum):
    """Lifecycle of a weekly plan container."""

    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class PlanItemStatus(str, Enum):
    """Lifecycle of a single plan item.

    Legal transitions (validated in the service):

        PENDING → IN_PROGRESS → COMPLETED
        PENDING → SNOOZED → PENDING      (only if the source still exists)
        PENDING / IN_PROGRESS / SNOOZED → DISMISSED
        any open state → EXPIRED          (source resolved / period ended)

    COMPLETED / DISMISSED / EXPIRED are terminal.
    """

    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    SNOOZED = "SNOOZED"
    DISMISSED = "DISMISSED"
    EXPIRED = "EXPIRED"


class PlanItemPriority(str, Enum):
    """Deterministic priority bands — never an LLM guess."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class PlanItemCategory(str, Enum):
    """Internal plan categories — the canonical insight→plan mapping target."""

    REVIEW_SPENDING = "REVIEW_SPENDING"
    REVIEW_BUDGET = "REVIEW_BUDGET"
    IMPROVE_CASHFLOW = "IMPROVE_CASHFLOW"
    REPLAN_GOAL = "REPLAN_GOAL"
    REVIEW_DEBT = "REVIEW_DEBT"
    BUILD_RESERVE = "BUILD_RESERVE"
    REVIEW_TAX = "REVIEW_TAX"
    REVIEW_RECURRING_COST = "REVIEW_RECURRING_COST"
    REVIEW_NETWORTH = "REVIEW_NETWORTH"
    COMPLETE_PROFILE = "COMPLETE_PROFILE"


class PlanItemSource(str, Enum):
    """Where a plan item originated — powers "Why is this in my plan?"."""

    RADAR = "RADAR"
    GOAL = "GOAL"
    BUDGET = "BUDGET"
    CASHFLOW = "CASHFLOW"
    ACTION_HISTORY = "ACTION_HISTORY"
    SYSTEM = "SYSTEM"


class CompletionSource(str, Enum):
    """How a plan item reached COMPLETED — feeds future outcome tracking."""

    USER = "USER"
    ACTION_EXECUTION = "ACTION_EXECUTION"
    SYSTEM_RECONCILIATION = "SYSTEM_RECONCILIATION"


class SnoozeOption(str, Enum):
    """Fixed snooze windows — resolved server-side to concrete timestamps."""

    LATER_TODAY = "LATER_TODAY"
    TOMORROW = "TOMORROW"
    NEXT_WEEK = "NEXT_WEEK"


class PlanErrorCode(str, Enum):
    """Controlled error categories — never expose raw stack traces."""

    PLAN_NOT_FOUND = "PLAN_NOT_FOUND"
    PLAN_ITEM_NOT_FOUND = "PLAN_ITEM_NOT_FOUND"
    INVALID_TRANSITION = "INVALID_TRANSITION"
    ITEM_ALREADY_COMPLETED = "ITEM_ALREADY_COMPLETED"
    ITEM_ALREADY_DISMISSED = "ITEM_ALREADY_DISMISSED"
    INVALID_SNOOZE = "INVALID_SNOOZE"
    SOURCE_INSIGHT_NOT_FOUND = "SOURCE_INSIGHT_NOT_FOUND"
    ACTION_NOT_AVAILABLE = "ACTION_NOT_AVAILABLE"
    PLAN_GENERATION_FAILED = "PLAN_GENERATION_FAILED"


PLAN_VERSION = "action_plan_v1"

# Hard cap on simultaneously active items — the plan is selective by design.
PLAN_MAX_ACTIVE_ITEMS = 5

# ── Legal status transitions ───────────────────────────────────────────────
# Key: current status → set of statuses it may move to.
ITEM_TRANSITIONS: dict[PlanItemStatus, set[PlanItemStatus]] = {
    PlanItemStatus.PENDING: {
        PlanItemStatus.IN_PROGRESS,
        PlanItemStatus.COMPLETED,
        PlanItemStatus.SNOOZED,
        PlanItemStatus.DISMISSED,
        PlanItemStatus.EXPIRED,
    },
    PlanItemStatus.IN_PROGRESS: {
        PlanItemStatus.COMPLETED,
        PlanItemStatus.SNOOZED,
        PlanItemStatus.DISMISSED,
        PlanItemStatus.EXPIRED,
    },
    PlanItemStatus.SNOOZED: {
        PlanItemStatus.PENDING,      # snooze elapsed + source still active
        PlanItemStatus.DISMISSED,
        PlanItemStatus.EXPIRED,      # snooze elapsed + source resolved
    },
    PlanItemStatus.COMPLETED: set(),
    PlanItemStatus.DISMISSED: set(),
    PlanItemStatus.EXPIRED: set(),
}


def can_transition(from_status: str, to_status: str) -> bool:
    """Validate a plan-item status transition."""
    try:
        src = PlanItemStatus(from_status)
        dst = PlanItemStatus(to_status)
    except ValueError:
        return False
    return dst in ITEM_TRANSITIONS.get(src, set())


# Statuses that count as "open" work the user still has to deal with.
OPEN_ITEM_STATUSES = {
    PlanItemStatus.PENDING.value,
    PlanItemStatus.IN_PROGRESS.value,
    PlanItemStatus.SNOOZED.value,
}
