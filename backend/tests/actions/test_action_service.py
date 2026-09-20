"""ActionService integration tests — preview/execute/undo/safety.

Runs against the shared in-memory SQLite session; every assertion checks
real database state, not mocks.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
import pytest_asyncio
from sqlalchemy import select

from app.actions.action_types import (
    ActionErrorCode,
    ActionExecutionStatus,
    ActionOperation,
    ActionPreviewStatus,
)
from app.actions.errors import ActionError
from app.actions.schemas import ActionPreviewRequest
from app.actions.service import ActionService
from app.models.audit_logs import AuditLog
from app.models.budgets import Budget
from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.goals import Goal
from app.models.income import Income
from app.repositories.expenses import ExpenseRepository
from app.schemas.budgets import BudgetCreate, BudgetUpdate
from app.schemas.goals import GoalCreate
from app.schemas.income import IncomeCreate
from app.services.budgets import BudgetService
from app.services.goals import GoalService
from app.services.income import IncomeService
from app.services.users import UserService


@pytest_asyncio.fixture
async def category(db_session):
    cat = ExpenseCategory(name="Food", is_system=False, display_order=99)
    db_session.add(cat)
    await db_session.flush()
    return cat


@pytest_asyncio.fixture
async def budget(db_session, test_user, category):
    return await BudgetService(db_session).create_for_user(
        test_user.id, BudgetCreate(category_id=category.id, monthly_limit=Decimal("12000"))
    )


def _preview_request(operation: str, arguments: dict) -> ActionPreviewRequest:
    return ActionPreviewRequest(operation=operation, arguments=arguments)


async def _audit_count(db_session, user_id, action) -> int:
    result = await db_session.execute(
        select(AuditLog).where(AuditLog.user_id == user_id, AuditLog.action == action)
    )
    return len(list(result.scalars().all()))


# ── Preview ──────────────────────────────────────────────────────────────


async def test_preview_update_budget_does_not_mutate(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    assert preview.status == ActionPreviewStatus.AWAITING_CONFIRMATION
    assert preview.entity_name == "Food"
    assert preview.before["monthlyLimit"] == 12000.0
    assert preview.after["monthlyLimit"] == 8000.0
    assert preview.impact["monthlyBudgetChange"] == -4000.0
    assert preview.expires_at is not None
    assert preview.requires_confirmation is True

    # The stored budget must be untouched.
    await db_session.refresh(budget)
    assert float(budget.monthly_limit) == 12000.0


async def test_preview_missing_amount_asks_clarification(db_session, test_user):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food"}),
    )
    assert preview.status == ActionPreviewStatus.NEEDS_INPUT
    assert "monthlyLimit" in preview.missing_fields
    assert preview.clarification_question
    assert preview.execution_id is None


async def test_preview_unsupported_operation(db_session, test_user):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("DELETE_ACCOUNT", {}),
    )
    assert preview.status == ActionPreviewStatus.NOT_SUPPORTED


async def test_preview_unknown_category_fails(db_session, test_user):
    service = ActionService(db_session)
    with pytest.raises(ActionError) as exc:
        await service.preview(
            test_user.id,
            _preview_request("UPDATE_BUDGET", {"categoryName": "nope", "monthlyLimit": 100}),
        )
    assert exc.value.code == ActionErrorCode.ENTITY_NOT_FOUND


# ── Execute ──────────────────────────────────────────────────────────────


async def test_execute_update_budget(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    result = await service.execute(test_user.id, preview.execution_id)

    assert result.status == ActionExecutionStatus.EXECUTED
    assert result.undo_available is True
    await db_session.refresh(budget)
    assert float(budget.monthly_limit) == 8000.0
    # Audit trail written.
    assert await _audit_count(db_session, test_user.id, "copilot.action.execute") == 1


async def test_execute_is_idempotent(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    first = await service.execute(test_user.id, preview.execution_id)
    second = await service.execute(test_user.id, preview.execution_id)
    assert second.status == ActionExecutionStatus.EXECUTED
    assert second.execution_id == first.execution_id
    await db_session.refresh(budget)
    assert float(budget.monthly_limit) == 8000.0


async def test_execute_stale_preview_rejected(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    # Someone changes the budget after the preview.
    await BudgetService(db_session).update_for_user(
        test_user.id, budget.id, BudgetUpdate(monthly_limit=Decimal("10000"))
    )
    with pytest.raises(ActionError) as exc:
        await service.execute(test_user.id, preview.execution_id)
    assert exc.value.code == ActionErrorCode.STALE_PREVIEW
    await db_session.refresh(budget)
    assert float(budget.monthly_limit) == 10000.0


async def test_execute_expired_preview_rejected(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    # Force expiry.
    from app.repositories.copilot_action_executions import CopilotActionExecutionRepository

    repo = CopilotActionExecutionRepository(db_session)
    execution = await repo.get_by_id(preview.execution_id)
    execution.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    await db_session.flush()

    with pytest.raises(ActionError) as exc:
        await service.execute(test_user.id, preview.execution_id)
    assert exc.value.code == ActionErrorCode.EXPIRED_ACTION


async def test_execute_other_users_execution_rejected(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    other = await UserService(db_session).get_or_create_user(
        {"sub": "other-user", "email": "other@example.com"}
    )
    with pytest.raises(ActionError) as exc:
        await service.execute(other.id, preview.execution_id)
    assert exc.value.code == ActionErrorCode.ENTITY_NOT_FOUND


async def test_execute_create_expense_creates_record(db_session, test_user, category):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("CREATE_EXPENSE", {"categoryName": "Food", "amount": 1250}),
    )
    assert preview.status == ActionPreviewStatus.AWAITING_CONFIRMATION
    result = await service.execute(test_user.id, preview.execution_id)
    assert result.status == ActionExecutionStatus.EXECUTED

    repo = ExpenseRepository(db_session)
    expenses = await repo.list_for_user(test_user.id)
    assert len(expenses) == 1
    assert float(expenses[0].amount) == 1250.0


async def test_execute_create_goal(db_session, test_user):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request(
            "CREATE_GOAL", {"goalName": "Laptop", "targetAmount": 75000}
        ),
    )
    result = await service.execute(test_user.id, preview.execution_id)
    assert result.status == ActionExecutionStatus.EXECUTED
    goals = await GoalService(db_session).list_for_user(test_user.id)
    assert len(goals) == 1
    assert goals[0].goal_name == "Laptop"


async def test_execute_update_income(db_session, test_user):
    income_svc = IncomeService(db_session)
    income = await income_svc.create_for_user(
        test_user.id,
        IncomeCreate(amount=Decimal("50000"), source="Salary", income_date=date.today()),
    )
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_INCOME", {"source": "salary", "amount": 100000}),
    )
    result = await service.execute(test_user.id, preview.execution_id)
    assert result.status == ActionExecutionStatus.EXECUTED
    await db_session.refresh(income)
    assert float(income.amount) == 100000.0


# ── Cancel ───────────────────────────────────────────────────────────────


async def test_cancel_pending_preview(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    result = await service.cancel(test_user.id, preview.execution_id)
    assert result.status == ActionExecutionStatus.CANCELLED
    await db_session.refresh(budget)
    assert float(budget.monthly_limit) == 12000.0


async def test_cancel_executed_action_rejected(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    await service.execute(test_user.id, preview.execution_id)
    with pytest.raises(ActionError):
        await service.cancel(test_user.id, preview.execution_id)


# ── Undo ─────────────────────────────────────────────────────────────────


async def test_undo_update_budget_restores_before_state(
    db_session, test_user, category, budget
):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    await service.execute(test_user.id, preview.execution_id)
    result = await service.undo(test_user.id, preview.execution_id)
    assert result.status == ActionExecutionStatus.UNDONE
    await db_session.refresh(budget)
    assert float(budget.monthly_limit) == 12000.0


async def test_undo_create_expense_soft_deletes(db_session, test_user, category):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("CREATE_EXPENSE", {"categoryName": "Food", "amount": 500}),
    )
    result = await service.execute(test_user.id, preview.execution_id)
    undone = await service.undo(test_user.id, preview.execution_id)
    assert undone.status == ActionExecutionStatus.UNDONE
    repo = ExpenseRepository(db_session)
    assert await repo.list_for_user(test_user.id) == []


async def test_undo_blocked_when_record_changed(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    await service.execute(test_user.id, preview.execution_id)
    # User edits the record again — undoing would destroy newer data.
    await BudgetService(db_session).update_for_user(
        test_user.id, budget.id, BudgetUpdate(monthly_limit=Decimal("9000"))
    )
    with pytest.raises(ActionError) as exc:
        await service.undo(test_user.id, preview.execution_id)
    assert exc.value.code == ActionErrorCode.STALE_PREVIEW


# ── History ──────────────────────────────────────────────────────────────


async def test_history_returns_only_own_actions(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    await service.execute(test_user.id, preview.execution_id)

    items = await service.history(test_user.id)
    assert len(items) == 1
    assert items[0].status == ActionExecutionStatus.EXECUTED
    assert items[0].undo_available is True
    assert items[0].entity_name == "Food"

    other = await UserService(db_session).get_or_create_user(
        {"sub": "other-user-2", "email": "other2@example.com"}
    )
    assert await service.history(other.id) == []


async def test_history_status_filter(db_session, test_user, category, budget):
    service = ActionService(db_session)
    preview = await service.preview(
        test_user.id,
        _preview_request("UPDATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 8000}),
    )
    await service.cancel(test_user.id, preview.execution_id)

    executed = await service.history(
        test_user.id, statuses=[ActionExecutionStatus.EXECUTED]
    )
    cancelled = await service.history(
        test_user.id, statuses=[ActionExecutionStatus.CANCELLED]
    )
    assert executed == []
    assert len(cancelled) == 1


# ── Ambiguity ────────────────────────────────────────────────────────────


async def test_ambiguous_goal_rejected(db_session, test_user):
    goals = GoalService(db_session)
    await goals.create_for_user(
        test_user.id, GoalCreate(goal_name="Laptop A", target_amount=Decimal("50000"))
    )
    await goals.create_for_user(
        test_user.id, GoalCreate(goal_name="Laptop B", target_amount=Decimal("60000"))
    )
    service = ActionService(db_session)
    with pytest.raises(ActionError) as exc:
        await service.preview(
            test_user.id,
            _preview_request(
                "UPDATE_GOAL", {"goalName": "Laptop", "targetAmount": 90000}
            ),
        )
    assert exc.value.code == ActionErrorCode.AMBIGUOUS_ENTITY


async def test_create_budget_conflict_rejected(db_session, test_user, category, budget):
    service = ActionService(db_session)
    with pytest.raises(ActionError) as exc:
        await service.preview(
            test_user.id,
            _preview_request(
                "CREATE_BUDGET", {"categoryName": "Food", "monthlyLimit": 5000}
            ),
        )
    assert exc.value.code == ActionErrorCode.INVALID_ARGUMENTS
