"""Controlled vocabularies for the Copilot action system.

Every status/operation/error code used by the action layer lives here —
no free-form strings elsewhere.
"""

from __future__ import annotations

from enum import Enum


class ActionOperation(str, Enum):
    """Executable financial operations supported in Phase 1.

    Deliberately excludes destructive deletes — the smallest safe action
    surface. Additions to this enum must be registered in
    ``ACTION_REGISTRY`` with a schema, preview, executor and undo policy.
    """

    CREATE_EXPENSE = "CREATE_EXPENSE"
    UPDATE_EXPENSE = "UPDATE_EXPENSE"
    CREATE_BUDGET = "CREATE_BUDGET"
    UPDATE_BUDGET = "UPDATE_BUDGET"
    CREATE_GOAL = "CREATE_GOAL"
    UPDATE_GOAL = "UPDATE_GOAL"
    CREATE_INCOME = "CREATE_INCOME"
    UPDATE_INCOME = "UPDATE_INCOME"


class ActionExecutionStatus(str, Enum):
    """Persisted lifecycle of a copilot action execution row."""

    PREVIEWED = "PREVIEWED"
    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION"
    EXECUTING = "EXECUTING"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    UNDONE = "UNDONE"


class ActionPreviewStatus(str, Enum):
    """Wire-level preview outcome — not all states are persisted."""

    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION"
    NEEDS_INPUT = "NEEDS_INPUT"
    NOT_SUPPORTED = "NOT_SUPPORTED"


class ActionSource(str, Enum):
    """Where the action originated. Phase 1 supports COPILOT only."""

    COPILOT = "COPILOT"
    USER_UI = "USER_UI"


class ActionErrorCode(str, Enum):
    """Controlled error categories — never expose raw stack traces."""

    INVALID_ACTION = "INVALID_ACTION"
    INVALID_ARGUMENTS = "INVALID_ARGUMENTS"
    ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND"
    ENTITY_NOT_OWNED = "ENTITY_NOT_OWNED"
    AMBIGUOUS_ENTITY = "AMBIGUOUS_ENTITY"
    STALE_PREVIEW = "STALE_PREVIEW"
    EXPIRED_ACTION = "EXPIRED_ACTION"
    ALREADY_EXECUTED = "ALREADY_EXECUTED"
    NOT_REVERSIBLE = "NOT_REVERSIBLE"
    EXECUTION_FAILED = "EXECUTION_FAILED"
    CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED"
