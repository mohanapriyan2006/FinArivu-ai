"""Entity snapshot serializers for the action layer.

Snapshots serve two purposes:

* display — ``before``/``after`` shown on preview and result cards
* staleness — a canonical ``state_hash`` of the mutable fields so a
  preview can detect that the underlying record changed

All snapshots use camelCase keys (same convention as API schemas).
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.models.budgets import Budget
from app.models.expenses import Expense
from app.models.goals import Goal
from app.models.income import Income


def _num(value: Any) -> float | None:
    return None if value is None else float(value)


def _date(value: Any) -> str | None:
    return None if value is None else value.isoformat()


def expense_snapshot(expense: Expense) -> dict[str, Any]:
    return {
        "amount": _num(expense.amount),
        "categoryId": str(expense.category_id),
        "description": expense.description,
        "expenseDate": _date(expense.expense_date),
        "paymentMethod": expense.payment_method,
        "isRecurring": bool(expense.is_recurring),
    }


def budget_snapshot(budget: Budget) -> dict[str, Any]:
    return {
        "monthlyLimit": _num(budget.monthly_limit),
        "period": budget.period,
        "categoryId": str(budget.category_id),
    }


def goal_snapshot(goal: Goal) -> dict[str, Any]:
    return {
        "goalName": goal.goal_name,
        "targetAmount": _num(goal.target_amount),
        "currentAmount": _num(goal.current_amount),
        "targetDate": _date(goal.target_date),
        "priority": goal.priority,
        "status": goal.status,
        "description": goal.description,
    }


def income_snapshot(income: Income) -> dict[str, Any]:
    return {
        "amount": _num(income.amount),
        "source": income.source,
        "incomeDate": _date(income.income_date),
        "description": income.description,
        "isRecurring": bool(income.is_recurring),
        "isPrimary": bool(income.is_primary),
        "frequency": income.frequency,
    }


def state_hash(snapshot: dict[str, Any] | None) -> str:
    """Stable SHA-256 hash of a snapshot dict for staleness checks."""
    canonical = json.dumps(snapshot or {}, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def diff_snapshots(
    before: dict[str, Any] | None,
    after: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Reduce before/after to only the fields that changed.

    For creates (``before`` is None) the full ``after`` is returned with
    an empty ``before``.
    """
    if before is None:
        return {}, after
    changed_before: dict[str, Any] = {}
    changed_after: dict[str, Any] = {}
    for key, new_value in after.items():
        if before.get(key) != new_value:
            changed_before[key] = before.get(key)
            changed_after[key] = new_value
    return changed_before, changed_after
