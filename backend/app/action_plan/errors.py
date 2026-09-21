"""Financial Action Plan errors — controlled codes, no raw exceptions."""

from __future__ import annotations

import uuid

from app.exceptions import FinArivuException
from app.action_plan.plan_types import PlanErrorCode


class PlanError(FinArivuException):
    """Base plan error carrying a controlled PlanErrorCode."""

    def __init__(
        self,
        code: PlanErrorCode,
        message: str,
        status_code: int = 400,
    ) -> None:
        super().__init__(message, status_code=status_code, error_code=code.value)
        self.code = code

    @classmethod
    def plan_not_found(cls, plan_id: uuid.UUID) -> "PlanError":
        return cls(
            PlanErrorCode.PLAN_NOT_FOUND,
            "That financial plan does not exist.",
            status_code=404,
        )

    @classmethod
    def item_not_found(cls, item_id: uuid.UUID) -> "PlanError":
        return cls(
            PlanErrorCode.PLAN_ITEM_NOT_FOUND,
            "That plan item does not exist.",
            status_code=404,
        )

    @classmethod
    def invalid_transition(cls, current: str, target: str) -> "PlanError":
        return cls(
            PlanErrorCode.INVALID_TRANSITION,
            f"Plan item cannot move from {current} to {target}.",
            status_code=409,
        )

    @classmethod
    def already_completed(cls) -> "PlanError":
        return cls(
            PlanErrorCode.ITEM_ALREADY_COMPLETED,
            "This plan item is already completed.",
            status_code=409,
        )

    @classmethod
    def already_dismissed(cls) -> "PlanError":
        return cls(
            PlanErrorCode.ITEM_ALREADY_DISMISSED,
            "This plan item is already dismissed.",
            status_code=409,
        )

    @classmethod
    def invalid_snooze(cls, detail: str = "") -> "PlanError":
        return cls(
            PlanErrorCode.INVALID_SNOOZE,
            detail or "Invalid snooze request.",
            status_code=422,
        )

    @classmethod
    def source_not_found(cls) -> "PlanError":
        return cls(
            PlanErrorCode.SOURCE_INSIGHT_NOT_FOUND,
            "The source insight does not exist.",
            status_code=404,
        )
