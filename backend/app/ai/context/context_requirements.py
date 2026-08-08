from __future__ import annotations

from app.ai.context.domain import FinancialDomain


AGENT_CONTEXT_REQUIREMENTS: dict[str, list[FinancialDomain]] = {
    "BudgetAgent": [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.BUDGETS,
        FinancialDomain.CASH_FLOW,
    ],
    "GoalAgent": [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.GOALS,
    ],
    "RetirementAgent": [
        FinancialDomain.PROFILE,
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.INVESTMENTS,
        FinancialDomain.GOALS,
        FinancialDomain.LOANS,
    ],
    "TaxAgent": [
        FinancialDomain.INCOME,
        FinancialDomain.TAX,
    ],
    "HealthAgent": [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.LOANS,
        FinancialDomain.GOALS,
    ],
    "NetWorthAgent": [
        FinancialDomain.SAVINGS,
        FinancialDomain.INVESTMENTS,
        FinancialDomain.FIXED_DEPOSITS,
        FinancialDomain.LOANS,
        FinancialDomain.CREDIT_CARDS,
        FinancialDomain.INSURANCE,
        FinancialDomain.NET_WORTH,
    ],
    "EducationAgent": [],
    "ReportAgent": [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.LOANS,
        FinancialDomain.GOALS,
        FinancialDomain.NET_WORTH,
    ],
    "InsightAgent": [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.LOANS,
        FinancialDomain.GOALS,
    ],
    "RecommendationAgent": [
        FinancialDomain.INCOME,
        FinancialDomain.EXPENSES,
        FinancialDomain.SAVINGS,
        FinancialDomain.GOALS,
    ],
}


def get_required_domains(agent_names: list[str]) -> list[FinancialDomain]:
    """Return the union of domains required by a list of agents."""
    domains: set[FinancialDomain] = set()
    for name in agent_names:
        for domain in AGENT_CONTEXT_REQUIREMENTS.get(name, []):
            domains.add(domain)
    return sorted(domains, key=lambda d: d.value)
