"""Entity resolution for copilot actions.

Natural-language proposals carry names ("Dining", "Laptop", "salary")
rather than ids. These resolvers map names to user-owned entities and
raise controlled ``ActionError``\ s instead of guessing.

Rules:
- exact match wins; otherwise a single unambiguous partial match wins
- multiple matches → AMBIGUOUS_ENTITY with candidate names
- zero matches → ENTITY_NOT_FOUND
- ids are always re-verified as owned by the authenticated user
"""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.actions.errors import ActionError
from app.models.budgets import Budget
from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.goals import Goal
from app.models.income import Income
from app.repositories.budgets import BudgetRepository
from app.repositories.categories import ExpenseCategoryRepository
from app.repositories.expenses import ExpenseRepository
from app.repositories.goals import GoalRepository
from app.repositories.income import IncomeRepository


def _normalise(text: str | None) -> str:
    return (text or "").strip().lower()


async def resolve_category(
    session: AsyncSession,
    *,
    category_id: uuid.UUID | None = None,
    category_name: str | None = None,
) -> ExpenseCategory:
    """Resolve an expense category by id or (fuzzy) name."""
    repo = ExpenseCategoryRepository(session)

    if category_id is not None:
        category = await repo.get_by_id(category_id)
        if category is None:
            raise ActionError.entity_not_found("category", str(category_id))
        return category

    name = _normalise(category_name)
    if not name:
        raise ActionError.invalid_arguments(
            "Which category should I use?",
            missing_fields=["categoryName"],
        )

    # Exact match first (categories are global master data, seeded or
    # user-created via the categories API).
    all_categories = list(await repo.list(limit=500))
    exact = [c for c in all_categories if _normalise(c.name) == name]
    if len(exact) == 1:
        return exact[0]

    partial = [c for c in all_categories if name in _normalise(c.name)]
    if len(partial) == 1:
        return partial[0]
    if len(partial) > 1:
        raise ActionError.ambiguous_entity(
            "category", category_name or "", [c.name for c in partial],
        )
    raise ActionError.entity_not_found("category", category_name or "")


async def resolve_budget(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    budget_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    category_name: str | None = None,
) -> Budget:
    """Resolve a user-owned budget by id or by category."""
    repo = BudgetRepository(session)

    if budget_id is not None:
        budget = await repo.get_by_id(budget_id)
        if budget is None or budget.user_id != user_id:
            raise ActionError.entity_not_found("budget", str(budget_id))
        return budget

    category = await resolve_category(
        session, category_id=category_id, category_name=category_name,
    )
    budget = await repo.get_by_user_and_category(user_id, category.id)
    if budget is None:
        raise ActionError.entity_not_found("budget", category.name)
    return budget


async def resolve_goal(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    goal_id: uuid.UUID | None = None,
    goal_name: str | None = None,
) -> Goal:
    """Resolve a user-owned goal by id or name."""
    repo = GoalRepository(session)

    if goal_id is not None:
        goal = await repo.get_by_id(goal_id)
        if goal is None or goal.user_id != user_id:
            raise ActionError.entity_not_found("goal", str(goal_id))
        return goal

    name = _normalise(goal_name)
    if not name:
        raise ActionError.invalid_arguments(
            "Which goal would you like me to use?",
            missing_fields=["goalName"],
        )

    goals = await repo.list_for_user(user_id, status="Active")
    exact = [g for g in goals if _normalise(g.goal_name) == name]
    if len(exact) == 1:
        return exact[0]
    if len(exact) > 1:
        raise ActionError.ambiguous_entity(
            "goal", goal_name or "", [g.goal_name for g in exact],
        )

    partial = [g for g in goals if name in _normalise(g.goal_name)]
    if len(partial) == 1:
        return partial[0]
    if len(partial) > 1:
        raise ActionError.ambiguous_entity(
            "goal", goal_name or "", [g.goal_name for g in partial],
        )
    raise ActionError.entity_not_found("goal", goal_name or "")


async def resolve_income(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    income_id: uuid.UUID | None = None,
    source: str | None = None,
) -> Income:
    """Resolve a user-owned income record by id or source name."""
    repo = IncomeRepository(session)

    if income_id is not None:
        income = await repo.get_by_id(income_id)
        if income is None or income.user_id != user_id:
            raise ActionError.entity_not_found("income", str(income_id))
        return income

    name = _normalise(source)
    if not name:
        raise ActionError.invalid_arguments(
            "Which income record should I update?",
            missing_fields=["source"],
        )

    records = list(await repo.list_for_user(user_id))
    exact = [r for r in records if _normalise(r.source) == name]
    if not exact:
        exact = [r for r in records if name in _normalise(r.source)]
    if not exact:
        raise ActionError.entity_not_found("income", source or "")
    if len(exact) > 1:
        primary = [r for r in exact if r.is_primary]
        if len(primary) == 1:
            return primary[0]
        raise ActionError.ambiguous_entity(
            "income", source or "", [r.source for r in exact],
        )
    return exact[0]


async def resolve_expense(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    expense_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    category_name: str | None = None,
    expense_date: date | None = None,
) -> Expense:
    """Resolve a user-owned expense by id or by category (+optional date)."""
    repo = ExpenseRepository(session)

    if expense_id is not None:
        expense = await repo.get_by_id(expense_id)
        if expense is None or expense.user_id != user_id:
            raise ActionError.entity_not_found("expense", str(expense_id))
        return expense

    category = await resolve_category(
        session, category_id=category_id, category_name=category_name,
    )
    expenses = await repo.list_for_user(
        user_id, category_id=category.id, start_date=expense_date,
        end_date=expense_date,
    )
    if not expenses:
        raise ActionError.entity_not_found("expense", category.name)
    if len(expenses) > 1:
        raise ActionError.ambiguous_entity(
            "expense",
            category.name,
            [f"{e.description or category.name} ({e.expense_date})" for e in expenses],
        )
    return expenses[0]
