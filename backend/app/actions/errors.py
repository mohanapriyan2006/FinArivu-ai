"""Controlled action errors — safe to surface to the client."""

from __future__ import annotations

from typing import Any

from app.actions.action_types import ActionErrorCode
from app.exceptions import FinArivuException


class ActionError(FinArivuException):
    """An action-layer failure with a controlled error code.

    ``details`` may carry ``missing_fields`` or ``candidates`` for
    clarification, but must never contain raw exceptions or SQL text.
    """

    def __init__(
        self,
        code: ActionErrorCode,
        message: str,
        *,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, status_code=status_code, error_code=code.value)
        self.code = code

    # ── Factories ─────────────────────────────────────────────────────

    @classmethod
    def invalid_action(cls, operation: str) -> "ActionError":
        return cls(
            ActionErrorCode.INVALID_ACTION,
            f"Unsupported action '{operation}'.",
        )

    @classmethod
    def invalid_arguments(
        cls, message: str, missing_fields: list[str] | None = None
    ) -> "ActionError":
        return cls(
            ActionErrorCode.INVALID_ARGUMENTS,
            message,
            status_code=422,
            details={"missing_fields": missing_fields or []},
        )

    @classmethod
    def entity_not_found(cls, entity_type: str, label: str) -> "ActionError":
        return cls(
            ActionErrorCode.ENTITY_NOT_FOUND,
            f"Could not find {entity_type} '{label}'.",
            status_code=404,
        )

    @classmethod
    def ambiguous_entity(
        cls, entity_type: str, label: str, candidates: list[str]
    ) -> "ActionError":
        return cls(
            ActionErrorCode.AMBIGUOUS_ENTITY,
            f"'{label}' matches multiple {entity_type} records.",
            status_code=422,
            details={"candidates": candidates},
        )

    @classmethod
    def stale_preview(cls) -> "ActionError":
        return cls(
            ActionErrorCode.STALE_PREVIEW,
            "This preview is out of date because the underlying record "
            "changed. Please create a new preview.",
            status_code=409,
        )

    @classmethod
    def expired(cls) -> "ActionError":
        return cls(
            ActionErrorCode.EXPIRED_ACTION,
            "This action preview has expired. Please create a new preview.",
            status_code=410,
        )

    @classmethod
    def already_executed(cls) -> "ActionError":
        return cls(
            ActionErrorCode.ALREADY_EXECUTED,
            "This action was already executed.",
            status_code=409,
        )

    @classmethod
    def not_reversible(cls) -> "ActionError":
        return cls(
            ActionErrorCode.NOT_REVERSIBLE,
            "This action cannot be safely undone automatically.",
            status_code=409,
        )

    @classmethod
    def execution_failed(cls, message: str = "The action could not be completed.") -> "ActionError":
        return cls(
            ActionErrorCode.EXECUTION_FAILED,
            message,
            status_code=500,
        )

    @classmethod
    def confirmation_required(cls) -> "ActionError":
        return cls(
            ActionErrorCode.CONFIRMATION_REQUIRED,
            "This action requires an explicit confirmation.",
            status_code=409,
        )
