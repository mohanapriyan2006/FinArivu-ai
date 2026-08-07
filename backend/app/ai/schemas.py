"""Pydantic v2 schemas for the AI Copilot module.

All schemas use camelCase serialisation via the project-wide ``BaseSchema``
so the React Native frontend receives consistent JSON keys.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema


# ── Enums ─────────────────────────────────────────────────────────────────

class CopilotIntent(StrEnum):
    """Known intents the planner can route to."""

    BUDGET_ANALYSIS = "budget_analysis"
    TAX_PLANNING = "tax_planning"
    GOAL_TRACKING = "goal_tracking"
    RETIREMENT_PLANNING = "retirement_planning"
    HEALTH_SCORE = "health_score"
    EDUCATION = "education"
    REPORT_SUMMARY = "report_summary"
    NET_WORTH = "net_worth"
    GENERAL = "general"


class ResponseStyle(StrEnum):
    """Desired tone for the AI explanation layer."""

    EDUCATIONAL = "educational"
    CONCISE = "concise"
    DETAILED = "detailed"
    FRIENDLY = "friendly"


# ── Request schemas ───────────────────────────────────────────────────────

class CopilotChatRequest(BaseSchema):
    """Incoming copilot chat message from the client."""

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "str_strip_whitespace": False,
        "ser_json_by_alias": True,
    }

    session_id: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=2000)
    context_hints: list[str] = Field(
        default_factory=list,
        max_length=10,
        description="Optional hints from the client about the current screen/context.",
    )


class CopilotFeedbackRequest(BaseSchema):
    """User feedback on a copilot response."""

    message_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(default="", max_length=500)


# ── Planner output (internal) ────────────────────────────────────────────

class PlannerOutput(BaseSchema):
    """Structured JSON the AI planner must return."""

    intent: CopilotIntent = CopilotIntent.GENERAL
    agents: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    needs_profile: bool = False
    needs_history: bool = False
    response_style: ResponseStyle = ResponseStyle.EDUCATIONAL


# ── Agent result (internal) ──────────────────────────────────────────────

class AgentResult(BaseSchema):
    """Data packet returned by a specialist agent."""

    agent_name: str
    data: dict[str, Any] = Field(default_factory=dict)
    summary: str = ""
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    error: str | None = None


# ── Stream events ────────────────────────────────────────────────────────

class StreamEventType(StrEnum):
    """SSE event types the streaming endpoint emits."""

    TOKEN = "token"
    AGENT_START = "agent_start"
    AGENT_DONE = "agent_done"
    DATA = "data"
    ERROR = "error"
    DONE = "done"


class StreamEvent(BaseSchema):
    """Single SSE event payload."""

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "str_strip_whitespace": False,
        "ser_json_by_alias": True,
    }

    event_type: StreamEventType
    data: str = ""
    agent_name: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


# ── Response schemas ─────────────────────────────────────────────────────

class CopilotChatResponse(BaseSchema):
    """Full copilot response returned to the client."""

    message_id: UUID | None = None
    message: str
    intent: CopilotIntent = CopilotIntent.GENERAL
    agents_used: list[str] = Field(default_factory=list)
    data: dict[str, Any] = Field(default_factory=dict)
    disclaimer: str = (
        "The information provided is for educational purposes only "
        "and is not financial, investment, tax, or legal advice."
    )
    guardrail_triggered: bool = False


class CopilotHealthResponse(BaseSchema):
    """Health check response for the AI subsystem."""

    provider: str
    model: str
    healthy: bool
    latency_ms: int = 0
