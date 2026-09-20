from __future__ import annotations

from app.ai.context.domain import FinancialDomain
from app.ai.registry.registry import AgentName


CONTEXT_KEY_TO_DOMAIN: dict[str, FinancialDomain] = {
    "monthly_income": FinancialDomain.INCOME,
    "income": FinancialDomain.INCOME,
    "monthly_expenses": FinancialDomain.EXPENSES,
    "expenses": FinancialDomain.EXPENSES,
    "budget_limits": FinancialDomain.BUDGETS,
    "budgets": FinancialDomain.BUDGETS,
    "savings": FinancialDomain.SAVINGS,
    "investments": FinancialDomain.INVESTMENTS,
    "fixed_deposits": FinancialDomain.FIXED_DEPOSITS,
    "loans": FinancialDomain.LOANS,
    "credit_cards": FinancialDomain.CREDIT_CARDS,
    "goals": FinancialDomain.GOALS,
    "insurance": FinancialDomain.INSURANCE,
    "tax_profile": FinancialDomain.TAX,
    "tax": FinancialDomain.TAX,
    "profile": FinancialDomain.PROFILE,
    "net_worth": FinancialDomain.NET_WORTH,
    "cash_flow": FinancialDomain.CASH_FLOW,
    "health_score": FinancialDomain.HEALTH,
    "financial_health": FinancialDomain.HEALTH,
}


AGENT_CONTEXT_REQUIREMENTS: dict[str, list[FinancialDomain]] = {
    AgentName.BUDGET.value: [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.BUDGETS,
        FinancialDomain.CASH_FLOW,
    ],
    AgentName.GOAL.value: [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.GOALS,
    ],
    AgentName.RETIREMENT.value: [
        FinancialDomain.PROFILE,
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.INVESTMENTS,
        FinancialDomain.GOALS,
        FinancialDomain.LOANS,
    ],
    AgentName.TAX.value: [
        FinancialDomain.INCOME,
        FinancialDomain.TAX,
    ],
    AgentName.HEALTH.value: [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.LOANS,
        FinancialDomain.GOALS,
    ],
    AgentName.NETWORTH.value: [
        FinancialDomain.SAVINGS,
        FinancialDomain.INVESTMENTS,
        FinancialDomain.FIXED_DEPOSITS,
        FinancialDomain.LOANS,
        FinancialDomain.CREDIT_CARDS,
        FinancialDomain.INSURANCE,
        FinancialDomain.NET_WORTH,
    ],
    AgentName.EDUCATION.value: [],
    AgentName.REPORT.value: [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.LOANS,
        FinancialDomain.GOALS,
        FinancialDomain.NET_WORTH,
    ],
    AgentName.INSIGHT.value: [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.LOANS,
        FinancialDomain.GOALS,
    ],
    AgentName.RECOMMENDATION.value: [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.GOALS,
    ],
    AgentName.CASHFLOW.value: [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.CASH_FLOW,
    ],
}


def get_required_domains(agent_names: list[str]) -> list[FinancialDomain]:
    """Return the union of domains required by a list of agents."""
    domains: set[FinancialDomain] = set()
    for name in agent_names:
        for domain in AGENT_CONTEXT_REQUIREMENTS.get(name, []):
            domains.add(domain)
    return sorted(domains, key=lambda d: d.value)


def resolve_required_domains(required_context: list[str]) -> list[FinancialDomain]:
    """Map a list of controller required_context keys to FinancialDomain values."""
    domains: set[FinancialDomain] = set()
    for key in required_context:
        normalized = key.strip().lower().replace(" ", "_")
        domain = CONTEXT_KEY_TO_DOMAIN.get(normalized)
        if domain is not None:
            domains.add(domain)
    return sorted(domains, key=lambda d: d.value)
