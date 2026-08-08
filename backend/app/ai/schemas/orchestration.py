from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class IntentEnum(str, Enum):
    """Supported copilot intents."""

    BUDGET = "budget"
    EXPENSE = "expense"
    GOAL = "goal"
    RETIREMENT = "retirement"
    TAX = "tax"
    HEALTH = "health"
    NETWORTH = "networth"
    EDUCATION = "education"
    INVESTMENT_EDUCATION = "investment_education"
    UNSUPPORTED_INVESTMENT_ADVICE = "unsupported_investment_advice"
    CASH_FLOW = "cash_flow"
    SCENARIO = "scenario"
    REPORT = "report"
    GREETING = "greeting"
    GENERAL = "general"
    MIXED = "mixed"


class FinancialContext(BaseModel):
    """Aggregated user financial context passed to every agent."""

    version: str = "1.0"
    profile: dict[str, Any] = Field(default_factory=dict)
    income: dict[str, Any] = Field(default_factory=dict)
    expenses: dict[str, Any] = Field(default_factory=dict)
    budgets: list[dict[str, Any]] = Field(default_factory=list)
    savings: dict[str, Any] = Field(default_factory=dict)
    investments: dict[str, Any] = Field(default_factory=dict)
    fixed_deposits: list[dict[str, Any]] = Field(default_factory=list)
    loans: list[dict[str, Any]] = Field(default_factory=list)
    credit_cards: list[dict[str, Any]] = Field(default_factory=list)
    goals: list[dict[str, Any]] = Field(default_factory=list)
    insurance: list[dict[str, Any]] = Field(default_factory=list)
    tax_profile: dict[str, Any] = Field(default_factory=dict)
    assets: list[dict[str, Any]] = Field(default_factory=list)
    liabilities: list[dict[str, Any]] = Field(default_factory=list)
    net_worth: dict[str, Any] = Field(default_factory=dict)
    cash_flow: dict[str, Any] = Field(default_factory=dict)
    health_score: dict[str, Any] = Field(default_factory=dict)
    tax_regime: str | None = None
    conversation_summary: str = ""
    preferences: dict[str, Any] = Field(default_factory=dict)
    data_available: list[str] = Field(default_factory=list)
    data_missing: list[str] = Field(default_factory=list)


class IntentResult(BaseModel):
    """Output of the intent classifier."""

    intent: IntentEnum = IntentEnum.GENERAL
    confidence: float = 1.0
    entities: dict[str, Any] = Field(default_factory=dict)
    requested_modules: list[str] = Field(default_factory=list)


class ExecutionStep(BaseModel):
    """A single agent execution step inside an execution plan."""

    agent_name: str
    dependencies: list[str] = Field(default_factory=list)
    timeout_seconds: int = 30


class ExecutionPlan(BaseModel):
    """Plan produced by the planner for the orchestrator."""

    intent: IntentEnum = IntentEnum.GENERAL
    steps: list[ExecutionStep] = Field(default_factory=list)
    response_style: str = "educational"


class AgentRequest(BaseModel):
    """Input to a specialist agent."""

    user_id: str
    session_id: str
    agent_name: str
    user_message: str
    financial_context: FinancialContext
    entities: dict[str, Any] = Field(default_factory=dict)


class AgentResponse(BaseModel):
    """Output from a specialist agent."""

    agent_name: str
    data: dict[str, Any] = Field(default_factory=dict)
    summary: str = ""
    confidence: float = 1.0
    error: str | None = None


class Artifact(BaseModel):
    """Structured artifact returned with the chat response."""

    type: str
    title: str
    content: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Final response returned by AIController."""

    message: str
    intent: str = "general"
    agents_used: list[str] = Field(default_factory=list)
    data: dict[str, Any] = Field(default_factory=dict)
    artifacts: list[Artifact] = Field(default_factory=list)
    guardrail_triggered: bool = False
    disclaimer: str = "The information provided is for educational purposes only."
    provider: str | None = None
    model: str | None = None


class ConversationSummary(BaseModel):
    """Summary of a conversation session."""

    session_id: str
    summary: str
    last_updated: str
