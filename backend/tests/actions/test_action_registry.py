"""Contract tests for the action registry and typed argument schemas."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.actions.action_types import ActionOperation, ActionExecutionStatus
from app.actions.registry import ACTION_REGISTRY, get_action_definition, parse_arguments
from app.actions.schemas import ACTION_ARG_SCHEMAS


def test_every_operation_is_registered() -> None:
    assert set(ACTION_REGISTRY) == set(ActionOperation)


def test_every_operation_has_arg_schema() -> None:
    for op, definition in ACTION_REGISTRY.items():
        assert ACTION_ARG_SCHEMAS[op] is definition.args_model


def test_unknown_operation_rejected() -> None:
    assert get_action_definition("DELETE_ACCOUNT") is None
    assert get_action_definition("TRANSFER_MONEY") is None
    assert get_action_definition("") is None


def test_no_delete_operations_exist() -> None:
    for op in ActionOperation:
        assert not op.value.startswith("DELETE")


def test_all_operations_require_confirmation_and_support_undo() -> None:
    for definition in ACTION_REGISTRY.values():
        assert definition.supports_undo is True


def test_parse_arguments_validates_types() -> None:
    definition = get_action_definition("UPDATE_BUDGET")
    args = parse_arguments(definition, {"categoryName": "Food", "monthlyLimit": 8000})
    assert args.monthly_limit == 8000


def test_parse_arguments_rejects_bad_amount() -> None:
    definition = get_action_definition("CREATE_EXPENSE")
    with pytest.raises(ValidationError):
        parse_arguments(definition, {"amount": -50, "categoryName": "Food"})


def test_update_budget_requires_a_change() -> None:
    definition = get_action_definition("UPDATE_BUDGET")
    with pytest.raises(ValidationError):
        parse_arguments(definition, {"categoryName": "Food"})


def test_execution_status_enum_is_complete() -> None:
    assert {s.value for s in ActionExecutionStatus} == {
        "PREVIEWED",
        "AWAITING_CONFIRMATION",
        "EXECUTING",
        "EXECUTED",
        "FAILED",
        "CANCELLED",
        "EXPIRED",
        "UNDONE",
    }
