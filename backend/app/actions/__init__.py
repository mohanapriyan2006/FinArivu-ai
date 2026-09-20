"""Copilot action subsystem.

Transforms validated user intent into safe, user-approved financial
mutations. The LLM never touches the database directly — it can only
produce an ``ActionProposal`` which must pass through the registry,
validation, preview and explicit confirmation before the executor calls
the existing domain services.
"""

from app.actions.action_types import (
    ActionErrorCode,
    ActionExecutionStatus,
    ActionOperation,
    ActionPreviewStatus,
    ActionSource,
)
from app.actions.errors import ActionError
from app.actions.registry import ACTION_REGISTRY, get_action_definition
from app.actions.schemas import (
    ActionExecuteRequest,
    ActionHistoryItem,
    ActionPreviewRequest,
    ActionPreviewResponse,
    ActionProposal,
    ActionResultResponse,
)

__all__ = [
    "ACTION_REGISTRY",
    "ActionError",
    "ActionErrorCode",
    "ActionExecuteRequest",
    "ActionExecutionStatus",
    "ActionHistoryItem",
    "ActionOperation",
    "ActionPreviewRequest",
    "ActionPreviewResponse",
    "ActionPreviewStatus",
    "ActionProposal",
    "ActionResultResponse",
    "ActionSource",
    "get_action_definition",
]
