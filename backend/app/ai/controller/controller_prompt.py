"""Prompts for the local-Phi-4 controller."""

from __future__ import annotations

from app.actions.action_types import ActionOperation
from app.ai.registry.registry import CONTROLLER_SELECTABLE_AGENTS
from app.ai.schemas.orchestration import IntentEnum


# Specialist agents the controller is allowed to select — derived from the
# canonical registry so the prompt can never drift from reality.
_ALLOWED_AGENTS = CONTROLLER_SELECTABLE_AGENTS

# Executable financial operations the controller may PROPOSE — never execute.
# Execution requires validation, preview and explicit user confirmation.
_ALLOWED_ACTIONS = [op.value for op in ActionOperation]

# Deterministic financial engines the agents may use (informational only —
# agents call tools, which call these engines).
_ALLOWED_TOOLS = [
    "BudgetEngine",
    "TaxEngine",
    "GoalEngine",
    "RetirementEngine",
    "NetWorthEngine",
    "HealthEngine",
    "CashFlowEngine",
    "SimulationEngine",
    "ReportEngine",
]

# Intents the controller may emit. `unsupported_investment_advice` is excluded
# deliberately — investment-advice requests are refused by the guardrail layer
# before planning, so the controller never needs to route them.
_ALLOWED_INTENTS = [
    i.value for i in IntentEnum if i is not IntentEnum.UNSUPPORTED_INVESTMENT_ADVICE
]

_ALLOWED_INTENTS_TEXT = ", ".join(_ALLOWED_INTENTS)

_CONTROLLER_SYSTEM = """\
You are FinArivu's Controller.  Analyse the user message and produce a single JSON object.
Rules:
- intent: one of {intents}
- risk_level: low/medium/high/critical.  Use high/critical for tax, retirement, debt, networth or anything requiring verification.
- required_context: list of data fields needed (e.g. monthly_income, monthly_expenses, savings, goals, tax_profile, loans, investments, net_worth, health_score)
- selected_agents: pick only from the allowed list; choose 1-3 relevant agents
- required_financial_tools: pick only from the allowed engines
- execution_mode: parallel unless one agent depends on another
- response_mode: explanation, clarification (when required_context missing), or rejection (for unsafe/unsupported)
- requires_verification: true for numerical/tax/retirement/debt/goal advice
- missing_information: list any missing required user data
- safety_action: allow, block, or educational_refusal (for investment advice/stock tips)
- response_style: educational, concise, detailed, or friendly
- proposed_action: when the user explicitly asks to ADD, CHANGE or UPDATE a financial
  record (expense, budget, goal, income), emit {{"operation": one of {actions},
  "arguments": {{...}}, "reason": "...", "missing_fields": [...]}}.
  Extract only values the user stated — NEVER invent amounts, dates, or names.
  For updates reference the entity by name (category_name, goal_name, source)
  unless an id is already known. Omit the field entirely for questions,
  analysis or advice requests. proposed_action is only a proposal — it will be
  validated and confirmed by the user before anything changes.
Do NOT include markdown, explanations, or text outside the JSON object.
""".format(intents=_ALLOWED_INTENTS_TEXT, actions=", ".join(_ALLOWED_ACTIONS))


CONTROLLER_PROMPT_TEMPLATE: str = """\
{system}

Allowed agents: {allowed_agents}
Allowed tools: {allowed_tools}

User message:
{user_message}

Financial context (if any):
{user_context}

Recent conversation:
{history}

Return ONLY a JSON object with this exact shape:
{{
  "request_id": "{request_id}",
  "intent": "...",
  "confidence": 0.0,
  "risk_level": "...",
  "required_context": ["..."],
  "selected_agents": ["..."],
  "required_financial_tools": ["..."],
  "execution_mode": "parallel",
  "response_mode": "explanation",
  "requires_verification": true,
  "missing_information": [],
  "safety_action": "allow"
}}
"""


def build_controller_messages(
    user_message: str,
    user_context: str,
    history: str,
    request_id: str,
) -> list[dict[str, str]]:
    """Build the message list for the controller from the prompt template."""
    prompt = CONTROLLER_PROMPT_TEMPLATE.format(
        system=_CONTROLLER_SYSTEM,
        allowed_agents=", ".join(_ALLOWED_AGENTS),
        allowed_tools=", ".join(_ALLOWED_TOOLS),
        user_message=user_message,
        user_context=user_context or "No profile data available.",
        history=history or "No prior messages.",
        request_id=request_id,
    )
    return [
        {"role": "system", "content": _CONTROLLER_SYSTEM},
        {"role": "user", "content": prompt},
    ]
