"""Pydantic schemas for the local-Phi-4 controller."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.ai.schemas import CopilotIntent, PlannerOutput, ResponseStyle
from app.ai.schemas.orchestration import ExecutionPlan, ExecutionStep, IntentEnum


class RiskLevel(str, Enum):
    """Risk classification for a user request."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ExecutionMode(str, Enum):
    """How the planned agents should run."""

    PARALLEL = "parallel"
    SERIAL = "serial"


class ResponseMode(str, Enum):
    """The kind of response the user should receive."""

    EXPLANATION = "explanation"
    CLARIFICATION = "clarification"
    REJECTION = "rejection"


class SafetyAction(str, Enum):
    """Final safety decision for the request."""

    ALLOW = "allow"
    BLOCK = "block"
    EDUCATIONAL_REFUSAL = "educational_refusal"


class ControllerPlan(BaseModel):
    """Plan produced by the local-Phi-4 controller and validated by Pydantic.

    The controller uses this structure for intent, risk, context selection and
    agent routing.  It is then converted into the existing ``ExecutionPlan``
    consumed by the LangGraph orchestrator.
    """

    request_id: str = ""
    intent: str = "general"
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    risk_level: str = "low"
    required_context: list[str] = Field(default_factory=list)
    selected_agents: list[str] = Field(default_factory=list)
    required_financial_tools: list[str] = Field(default_factory=list)
    execution_mode: str = "parallel"
    response_mode: str = "explanation"
    requires_verification: bool = True
    missing_information: list[str] = Field(default_factory=list)
    safety_action: str = "allow"
    response_style: str = "educational"
    entities: dict[str, Any] = Field(default_factory=dict)

    @field_validator(
        "risk_level",
        "execution_mode",
        "response_mode",
        "safety_action",
        "intent",
        "response_style",
        mode="before",
    )
    @classmethod
    def _lowercase(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.lower()
        return value

    @field_validator("risk_level", "execution_mode", "response_mode", "safety_action")
    @classmethod
    def _validate_enum(cls, value: str, info) -> str:
        valid: dict[str, list[str]] = {
            "risk_level": [e.value for e in RiskLevel],
            "execution_mode": [e.value for e in ExecutionMode],
            "response_mode": [e.value for e in ResponseMode],
            "safety_action": [e.value for e in SafetyAction],
        }
        allowed = valid.get(info.field_name, [])
        if value not in allowed:
            # Default to the first legal value for the field to keep the
            # pipeline from aborting on a malformed controller response.
            return allowed[0] if allowed else "low"
        return value

    def to_intent_enum(self) -> IntentEnum:
        """Map the controller intent string onto the existing IntentEnum."""
        normalised = self.intent.strip().lower().replace(" ", "_").upper()
        try:
            return IntentEnum[normalised]
        except KeyError:
            return IntentEnum.GENERAL

    def to_execution_plan(
        self,
        agent_timeout_seconds: int = 30,
    ) -> ExecutionPlan:
        """Convert the controller plan to the LangGraph ExecutionPlan."""
        steps: list[ExecutionStep] = []
        for name in self.selected_agents:
            steps.append(ExecutionStep(agent_name=name, timeout_seconds=agent_timeout_seconds))

        if self.execution_mode == "serial" and len(steps) > 1:
            for i in range(1, len(steps)):
                steps[i].dependencies = [steps[i - 1].agent_name]

        return ExecutionPlan(
            intent=self.to_intent_enum(),
            steps=steps,
            response_style=self.response_style,
        )

    def to_planner_output(self) -> PlannerOutput:
        """Convert the controller plan to the ResponseBuilder's PlannerOutput."""
        try:
            intent = CopilotIntent(self.intent)
        except ValueError:
            intent = CopilotIntent.GENERAL
        try:
            style = ResponseStyle(self.response_style)
        except ValueError:
            style = ResponseStyle.EDUCATIONAL
        return PlannerOutput(
            intent=intent,
            agents=self.selected_agents,
            tools=self.required_financial_tools,
            response_style=style,
        )

    def to_clarification_message(self) -> str:
        """Return a safe message asking for the missing information."""
        missing = ", ".join(self.missing_information) or "required information"
        return (
            "I need a bit more information to help you accurately. "
            f"Could you share your {missing}?"
        )

    @classmethod
    def default(cls, request_id: str = "") -> ControllerPlan:
        """Return a safe default plan that routes to the education agent."""
        return cls(
            request_id=request_id,
            intent="general",
            confidence=1.0,
            risk_level="low",
            selected_agents=["EducationAgent"],
            response_mode="explanation",
            requires_verification=False,
            safety_action="allow",
            response_style="educational",
        )
