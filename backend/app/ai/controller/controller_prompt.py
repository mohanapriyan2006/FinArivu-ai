"""Prompts for the local-Phi-4 controller."""

from __future__ import annotations


# Specialist agents the controller is allowed to select.
_ALLOWED_AGENTS = [
    "BudgetAgent",
    "TaxAgent",
    "GoalAgent",
    "RetirementAgent",
    "HealthAgent",
    "NetWorthAgent",
    "EducationAgent",
    "ReportAgent",
]

# Deterministic financial engines the agents may use.
_ALLOWED_TOOLS = [
    "BudgetEngine",
    "TaxEngine",
    "GoalEngine",
    "RetirementEngine",
    "DebtEngine",
    "NetWorthEngine",
    "FinancialHealthEngine",
    "CashFlowEngine",
]

_CONTROLLER_SYSTEM = """\
You are FinArivu's Controller.  Analyse the user message and produce a single JSON object.
Rules:
- intent: one of budget, expense, goal, retirement, tax, health, networth, education, investment_education, cash_flow, scenario, report, greeting, general, mixed
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
Do NOT include markdown, explanations, or text outside the JSON object.
"""


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
