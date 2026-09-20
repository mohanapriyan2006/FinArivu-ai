"""Central intent normalization for the Copilot pipeline.

There are exactly two intent vocabularies:

* ``IntentEnum`` (``app.ai.schemas.orchestration``) — the authoritative
  internal model used by the controller, orchestrator and decision engines.
* ``CopilotIntent`` (``app.ai.schemas.copilot``) — the API-level enum
  serialised to the React Native client.

This module is the ONLY place that converts between them and normalises
free-form controller strings. Do not re-implement mapping tables elsewhere.
"""

from __future__ import annotations

from app.ai.schemas.copilot import CopilotIntent
from app.ai.schemas.orchestration import IntentEnum

# Internal intent -> API-facing CopilotIntent.
# Intents without a dedicated API value collapse to the closest public
# category; "general" is the safe fallback for anything else.
INTERNAL_TO_COPILOT: dict[IntentEnum, CopilotIntent] = {
    IntentEnum.BUDGET: CopilotIntent.BUDGET_ANALYSIS,
    IntentEnum.EXPENSE: CopilotIntent.BUDGET_ANALYSIS,
    IntentEnum.GOAL: CopilotIntent.GOAL_TRACKING,
    IntentEnum.RETIREMENT: CopilotIntent.RETIREMENT_PLANNING,
    IntentEnum.TAX: CopilotIntent.TAX_PLANNING,
    IntentEnum.HEALTH: CopilotIntent.HEALTH_SCORE,
    IntentEnum.NETWORTH: CopilotIntent.NET_WORTH,
    IntentEnum.EDUCATION: CopilotIntent.EDUCATION,
    IntentEnum.INVESTMENT_EDUCATION: CopilotIntent.EDUCATION,
    IntentEnum.REPORT: CopilotIntent.REPORT_SUMMARY,
    IntentEnum.CASH_FLOW: CopilotIntent.GENERAL,
    IntentEnum.SCENARIO: CopilotIntent.GENERAL,
    IntentEnum.GREETING: CopilotIntent.GENERAL,
    IntentEnum.GENERAL: CopilotIntent.GENERAL,
    IntentEnum.MIXED: CopilotIntent.GENERAL,
    IntentEnum.UNSUPPORTED_INVESTMENT_ADVICE: CopilotIntent.GENERAL,
}

# API-facing CopilotIntent -> internal intent.
COPILOT_TO_INTERNAL: dict[CopilotIntent, IntentEnum] = {
    CopilotIntent.BUDGET_ANALYSIS: IntentEnum.BUDGET,
    CopilotIntent.GOAL_TRACKING: IntentEnum.GOAL,
    CopilotIntent.RETIREMENT_PLANNING: IntentEnum.RETIREMENT,
    CopilotIntent.TAX_PLANNING: IntentEnum.TAX,
    CopilotIntent.HEALTH_SCORE: IntentEnum.HEALTH,
    CopilotIntent.NET_WORTH: IntentEnum.NETWORTH,
    CopilotIntent.REPORT_SUMMARY: IntentEnum.REPORT,
    CopilotIntent.EDUCATION: IntentEnum.EDUCATION,
    CopilotIntent.GENERAL: IntentEnum.GENERAL,
}

# Extra spellings the LLM controller or older prompts may emit.
_INTENT_ALIASES: dict[str, IntentEnum] = {
    "budget_analysis": IntentEnum.BUDGET,
    "expenses": IntentEnum.EXPENSE,
    "spending": IntentEnum.EXPENSE,
    "goal_tracking": IntentEnum.GOAL,
    "goals": IntentEnum.GOAL,
    "retirement_planning": IntentEnum.RETIREMENT,
    "tax_planning": IntentEnum.TAX,
    "taxes": IntentEnum.TAX,
    "health_score": IntentEnum.HEALTH,
    "financial_health": IntentEnum.HEALTH,
    "net_worth": IntentEnum.NETWORTH,
    "cashflow": IntentEnum.CASH_FLOW,
    "investment": IntentEnum.INVESTMENT_EDUCATION,
    "investment_advice": IntentEnum.UNSUPPORTED_INVESTMENT_ADVICE,
    "reports": IntentEnum.REPORT,
    "report_summary": IntentEnum.REPORT,
    "summary": IntentEnum.REPORT,
    "hello": IntentEnum.GREETING,
    "hi": IntentEnum.GREETING,
}


def normalize_intent_str(value: str) -> IntentEnum:
    """Normalise a free-form intent string (controller output) to IntentEnum."""
    normalised = value.strip().lower().replace(" ", "_").replace("-", "_")
    try:
        return IntentEnum(normalised)
    except ValueError:
        pass
    alias = _INTENT_ALIASES.get(normalised)
    if alias is not None:
        return alias
    # Last resort: enum member NAME match (e.g. "NET_WORTH", "CashFlow").
    try:
        return IntentEnum[normalised.upper()]
    except KeyError:
        return IntentEnum.GENERAL


def to_internal_intent(value: str | IntentEnum | CopilotIntent) -> IntentEnum:
    """Convert any intent representation into the internal IntentEnum."""
    if isinstance(value, IntentEnum):
        return value
    if isinstance(value, CopilotIntent):
        return COPILOT_TO_INTERNAL.get(value, IntentEnum.GENERAL)
    return normalize_intent_str(value)


def to_copilot_intent(value: str | IntentEnum | CopilotIntent) -> CopilotIntent:
    """Convert any intent representation into the API-facing CopilotIntent."""
    if isinstance(value, CopilotIntent):
        return value
    return INTERNAL_TO_COPILOT.get(to_internal_intent(value), CopilotIntent.GENERAL)
