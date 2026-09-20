"""Controlled scenario errors — safe to surface to the client."""

from __future__ import annotations

from typing import Any

from app.exceptions import FinArivuException
from app.scenarios.scenario_types import ScenarioErrorCode


class ScenarioError(FinArivuException):
    """A scenario-layer failure with a controlled error code."""

    def __init__(
        self,
        code: ScenarioErrorCode,
        message: str,
        *,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, status_code=status_code, error_code=code.value)
        self.code = code
        self.details = details or {}

    @classmethod
    def invalid_scenario(cls, scenario_type: str) -> "ScenarioError":
        return cls(
            ScenarioErrorCode.INVALID_SCENARIO,
            f"Unsupported scenario '{scenario_type}'.",
        )

    @classmethod
    def invalid_parameters(
        cls, message: str, missing_fields: list[str] | None = None
    ) -> "ScenarioError":
        return cls(
            ScenarioErrorCode.INVALID_PARAMETERS,
            message,
            status_code=422,
            details={"missing_fields": missing_fields or []},
        )

    @classmethod
    def not_found(cls, scenario_id: str) -> "ScenarioError":
        return cls(
            ScenarioErrorCode.SCENARIO_NOT_FOUND,
            f"Could not find scenario '{scenario_id}'.",
            status_code=404,
        )

    @classmethod
    def entity_not_found(cls, entity_type: str, label: str) -> "ScenarioError":
        return cls(
            ScenarioErrorCode.ENTITY_NOT_FOUND,
            f"Could not find {entity_type} '{label}'.",
            status_code=404,
        )

    @classmethod
    def ambiguous_entity(
        cls, entity_type: str, label: str, candidates: list[str]
    ) -> "ScenarioError":
        return cls(
            ScenarioErrorCode.AMBIGUOUS_ENTITY,
            f"'{label}' matches multiple {entity_type} records.",
            status_code=422,
            details={"candidates": candidates},
        )

    @classmethod
    def comparison_limit(cls, limit: int) -> "ScenarioError":
        return cls(
            ScenarioErrorCode.COMPARISON_LIMIT,
            f"Compare supports at most {limit} scenarios.",
            status_code=422,
        )
