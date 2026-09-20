"""Authoritative executable action registry.

Every operation the copilot may propose/execute is declared here exactly
once — schema, entity type, affected financial domains, undo support and
confirmation requirements. The controller prompt, validator, preview
builder and executor all derive from this table; operation strings must
never be scattered across the codebase.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Type

from app.actions.action_types import ActionOperation
from app.actions.schemas import (
    ACTION_ARG_SCHEMAS,
    CreateBudgetArgs,
    CreateExpenseArgs,
    CreateGoalArgs,
    CreateIncomeArgs,
    UpdateBudgetArgs,
    UpdateExpenseArgs,
    UpdateGoalArgs,
    UpdateIncomeArgs,
    _ResolvableArgs,
)


@dataclass(frozen=True)
class ActionDefinition:
    """Static declaration of one executable operation."""

    operation: ActionOperation
    args_model: Type[_ResolvableArgs]
    entity_type: str
    is_create: bool
    supports_undo: bool
    affected_domains: tuple[str, ...]
    required_fields: tuple[str, ...]
    # Fields to ask about when validation fails on an otherwise empty update.
    clarify_fields: tuple[str, ...] = ()


ACTION_REGISTRY: dict[ActionOperation, ActionDefinition] = {
    ActionOperation.CREATE_EXPENSE: ActionDefinition(
        operation=ActionOperation.CREATE_EXPENSE,
        args_model=CreateExpenseArgs,
        entity_type="expense",
        is_create=True,
        supports_undo=True,  # undo = soft-delete the created expense
        affected_domains=("expenses", "budgets", "cash_flow", "health"),
        required_fields=("amount", "category_name"),
    ),
    ActionOperation.UPDATE_EXPENSE: ActionDefinition(
        operation=ActionOperation.UPDATE_EXPENSE,
        args_model=UpdateExpenseArgs,
        entity_type="expense",
        is_create=False,
        supports_undo=True,  # undo = restore before_state
        affected_domains=("expenses", "budgets", "cash_flow", "health"),
        required_fields=(),
        clarify_fields=("amount",),
    ),
    ActionOperation.CREATE_BUDGET: ActionDefinition(
        operation=ActionOperation.CREATE_BUDGET,
        args_model=CreateBudgetArgs,
        entity_type="budget",
        is_create=True,
        supports_undo=True,
        affected_domains=("budgets", "cash_flow", "health"),
        required_fields=("category_name", "monthly_limit"),
    ),
    ActionOperation.UPDATE_BUDGET: ActionDefinition(
        operation=ActionOperation.UPDATE_BUDGET,
        args_model=UpdateBudgetArgs,
        entity_type="budget",
        is_create=False,
        supports_undo=True,
        affected_domains=("budgets", "cash_flow", "health", "goals"),
        required_fields=(),
        clarify_fields=("monthlyLimit",),
    ),
    ActionOperation.CREATE_GOAL: ActionDefinition(
        operation=ActionOperation.CREATE_GOAL,
        args_model=CreateGoalArgs,
        entity_type="goal",
        is_create=True,
        supports_undo=True,
        affected_domains=("goals", "savings", "health"),
        required_fields=("goal_name", "target_amount"),
    ),
    ActionOperation.UPDATE_GOAL: ActionDefinition(
        operation=ActionOperation.UPDATE_GOAL,
        args_model=UpdateGoalArgs,
        entity_type="goal",
        is_create=False,
        supports_undo=True,
        affected_domains=("goals", "savings", "health"),
        required_fields=(),
        clarify_fields=("targetAmount",),
    ),
    ActionOperation.CREATE_INCOME: ActionDefinition(
        operation=ActionOperation.CREATE_INCOME,
        args_model=CreateIncomeArgs,
        entity_type="income",
        is_create=True,
        supports_undo=True,
        affected_domains=("income", "cash_flow", "savings", "health"),
        required_fields=("amount", "source"),
    ),
    ActionOperation.UPDATE_INCOME: ActionDefinition(
        operation=ActionOperation.UPDATE_INCOME,
        args_model=UpdateIncomeArgs,
        entity_type="income",
        is_create=False,
        supports_undo=True,
        affected_domains=("income", "cash_flow", "savings", "health"),
        required_fields=(),
        clarify_fields=("amount",),
    ),
}

# Operations the LLM/controller may propose — identical to the registry in
# Phase 1, kept as a separate constant so later phases can split them.
PROPOSABLE_OPERATIONS: tuple[ActionOperation, ...] = tuple(ACTION_REGISTRY)


def get_action_definition(operation: str | ActionOperation) -> ActionDefinition | None:
    """Look up an operation by name; None if unknown."""
    try:
        op = operation if isinstance(operation, ActionOperation) else ActionOperation(operation)
    except ValueError:
        return None
    return ACTION_REGISTRY.get(op)


def parse_arguments(definition: ActionDefinition, raw: dict) -> _ResolvableArgs:
    """Validate raw argument dict against the operation's typed schema.

    Raises pydantic ``ValidationError`` on failure — callers convert it
    to ``ActionError.invalid_arguments``.
    """
    return definition.args_model.model_validate(raw)
