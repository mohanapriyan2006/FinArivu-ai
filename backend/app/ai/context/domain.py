from __future__ import annotations

from enum import Enum


class FinancialDomain(str, Enum):
    """Controlled list of financial data domains the ContextBuilder can load."""

    PROFILE = "profile"
    INCOME = "income"
    EXPENSES = "expenses"
    BUDGETS = "budgets"
    SAVINGS = "savings"
    INVESTMENTS = "investments"
    FIXED_DEPOSITS = "fixed_deposits"
    LOANS = "loans"
    CREDIT_CARDS = "credit_cards"
    GOALS = "goals"
    INSURANCE = "insurance"
    TAX = "tax"
    NET_WORTH = "net_worth"
    CASH_FLOW = "cash_flow"
    HEALTH = "health"
