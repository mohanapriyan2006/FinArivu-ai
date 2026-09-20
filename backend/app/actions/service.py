"""ActionService — the copilot action orchestration layer.

Pipeline per action:

    typed args → resolve entities (user-owned) → before/after snapshots
    → deterministic impact → persisted preview → user confirmation
    → domain service mutation → post-state + engine recalculation
    → audit log

The service never invents values, never executes without confirmation,
and never trusts client-supplied state.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.actions import resolvers, serializers
from app.actions.action_types import (
    ActionErrorCode,
    ActionExecutionStatus,
    ActionOperation,
    ActionPreviewStatus,
    ActionSource,
)
from app.actions.errors import ActionError
from app.actions.registry import (
    ACTION_REGISTRY,
    ActionDefinition,
    get_action_definition,
)
from app.actions.schemas import (
    ActionHistoryItem,
    ActionPreviewRequest,
    ActionPreviewResponse,
    ActionProposal,
    ActionResultResponse,
    CreateBudgetArgs,
    CreateExpenseArgs,
    CreateGoalArgs,
    CreateIncomeArgs,
    UpdateBudgetArgs,
    UpdateExpenseArgs,
    UpdateGoalArgs,
    UpdateIncomeArgs,
)
from app.core.config import settings
from app.core.logger import logger
from app.exceptions import ConflictError, FinArivuException
from app.financial.engines.budget_engine import BudgetEngine
from app.financial.engines.cashflow_engine import CashFlowEngine
from app.financial.engines.goal_engine import GoalEngine
from app.models.audit_logs import AuditLog
from app.models.copilot_action_executions import CopilotActionExecution
from app.repositories.categories import ExpenseCategoryRepository
from app.repositories.copilot_action_executions import (
    CopilotActionExecutionRepository,
)
from app.schemas.base import to_camel
from app.schemas.budgets import BudgetCreate, BudgetUpdate
from app.schemas.expenses import ExpenseCreate, ExpenseUpdate
from app.schemas.goals import GoalCreate, GoalUpdate
from app.schemas.income import IncomeCreate, IncomeUpdate
from app.services.budgets import BudgetService
from app.services.expenses import ExpenseService
from app.services.goals import GoalService
from app.services.income import IncomeService


@dataclass
class _Prepared:
    """A fully validated, resolved action ready to preview or execute."""

    definition: ActionDefinition
    args: Any
    entity: Any | None
    entity_name: str
    title: str
    before: dict[str, Any] | None
    after: dict[str, Any]
    precondition: dict[str, Any] | None
    validated_payload: dict[str, Any] = field(default_factory=dict)


class ActionService:
    """Orchestrates proposals, previews, execution and undo."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CopilotActionExecutionRepository(session)
        self._expenses = ExpenseService(session)
        self._budgets = BudgetService(session)
        self._goals = GoalService(session)
        self._income = IncomeService(session)

    # ════════════════════════════════════════════════════════════════════
    # PREVIEW
    # ════════════════════════════════════════════════════════════════════

    async def preview(
        self,
        user_id: uuid.UUID,
        request: ActionPreviewRequest | ActionProposal,
        *,
        session_id: str | None = None,
        source: ActionSource = ActionSource.COPILOT,
    ) -> ActionPreviewResponse:
        """Validate + resolve + snapshot a proposed action.

        Persists an ``AWAITING_CONFIRMATION`` execution row when the
        action is fully resolvable; returns ``NEEDS_INPUT``/``NOT_SUPPORTED``
        without touching the database otherwise. Never mutates domain data.
        """
        definition = get_action_definition(request.operation)
        if definition is None:
            return ActionPreviewResponse(
                status=ActionPreviewStatus.NOT_SUPPORTED,
                title="Unsupported action",
                reason=getattr(request, "reason", "") or "",
                clarification_question=(
                    "I can't perform that kind of change yet. I can help with "
                    "expenses, budgets, goals and income records."
                ),
            )

        raw_args = dict(request.arguments or {})
        missing = list(getattr(request, "missing_fields", []) or [])
        if not missing:
            missing = self._missing_required(definition, raw_args)
        if missing:
            return ActionPreviewResponse(
                status=ActionPreviewStatus.NEEDS_INPUT,
                operation=definition.operation,
                title="More details needed",
                missing_fields=missing,
                clarification_question=self._clarification_for(definition, missing),
            )

        try:
            args = definition.args_model.model_validate(raw_args)
        except ValidationError as exc:
            missing_fields = sorted(
                {
                    str(err.get("loc", [""])[-1])
                    for err in exc.errors()
                    if err.get("type") == "missing"
                }
            )
            if not missing_fields and definition.clarify_fields:
                # e.g. an update with no change fields — ask for the value.
                missing_fields = list(definition.clarify_fields)
            if missing_fields:
                return ActionPreviewResponse(
                    status=ActionPreviewStatus.NEEDS_INPUT,
                    operation=definition.operation,
                    title="More details needed",
                    missing_fields=missing_fields,
                    clarification_question=self._clarification_for(
                        definition, missing_fields,
                    ),
                )
            raise ActionError.invalid_arguments(
                "The action arguments are not valid.",
            ) from exc

        prepared = await self._prepare(user_id, definition, args)
        expires_at = datetime.now(timezone.utc) + self._preview_ttl()

        engine_metrics = await self._engine_metrics(
            user_id, definition, prepared,
        )

        execution = CopilotActionExecution(
            user_id=user_id,
            session_id=session_id,
            operation=definition.operation.value,
            status=ActionExecutionStatus.AWAITING_CONFIRMATION.value,
            source=source.value,
            entity_type=definition.entity_type,
            entity_id=prepared.entity.id if prepared.entity is not None else None,
            title=prepared.title,
            entity_name=prepared.entity_name,
            reason=getattr(request, "reason", "") or "",
            request_payload=raw_args,
            validated_payload=prepared.validated_payload,
            before_state=prepared.before,
            after_state=prepared.after,
            impact=engine_metrics,
            affected_areas=list(definition.affected_domains),
            state_hash=self._precondition_hash(prepared),
            idempotency_key=uuid.uuid4().hex,
            undo_supported=definition.supports_undo,
            requires_confirmation=True,
            expires_at=expires_at,
        )
        self._session.add(execution)
        await self._session.flush()
        await self._session.refresh(execution)

        impact = dict(engine_metrics)
        impact.update(self._arithmetic_impact(definition, prepared))

        return ActionPreviewResponse(
            execution_id=execution.id,
            operation=definition.operation,
            status=ActionPreviewStatus.AWAITING_CONFIRMATION,
            title=prepared.title,
            entity_name=prepared.entity_name,
            before=prepared.before,
            after=prepared.after,
            impact=impact,
            affected_areas=list(definition.affected_domains),
            requires_confirmation=True,
            expires_at=expires_at,
            reason=getattr(request, "reason", "") or "",
        )

    # ════════════════════════════════════════════════════════════════════
    # EXECUTE
    # ════════════════════════════════════════════════════════════════════

    async def execute(
        self,
        user_id: uuid.UUID,
        execution_id: uuid.UUID,
        *,
        session_id: str | None = None,
    ) -> ActionResultResponse:
        """Confirm and execute a previewed action atomically."""
        execution = await self._repo.get_for_user(user_id, execution_id)
        if execution is None:
            raise ActionError.entity_not_found("action", str(execution_id))

        # Idempotent replay — a second execute returns the stored result.
        if execution.status == ActionExecutionStatus.EXECUTED.value:
            return self._result_from_execution(execution)
        if execution.status == ActionExecutionStatus.UNDONE.value:
            raise ActionError.not_reversible()
        if execution.status in (
            ActionExecutionStatus.CANCELLED.value,
            ActionExecutionStatus.FAILED.value,
            ActionExecutionStatus.EXPIRED.value,
        ):
            raise ActionError(
                ActionErrorCode.INVALID_ACTION,
                f"This action can no longer be executed (status: {execution.status}).",
                status_code=409,
            )
        if execution.status == ActionExecutionStatus.EXECUTING.value:
            raise ActionError.execution_failed("This action is already in progress.")

        now = datetime.now(timezone.utc)
        expires_at = execution.expires_at
        if expires_at is not None and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at is not None and expires_at <= now:
            execution.status = ActionExecutionStatus.EXPIRED.value
            await self._session.flush()
            raise ActionError.expired()

        definition = get_action_definition(execution.operation)
        if definition is None:
            raise ActionError.invalid_action(execution.operation)

        # Stale-preview protection: re-verify the precondition snapshot.
        await self._assert_not_stale(user_id, execution, definition)

        execution.status = ActionExecutionStatus.EXECUTING.value
        await self._session.flush()

        try:
            entity = await self._apply(user_id, definition, execution)
            after = self._snapshot(definition.entity_type, entity)
            metrics_after = await self._engine_metrics_for_entity(
                user_id, definition, entity,
            )
            execution.entity_id = entity.id
            execution.after_state = after
            execution.state_hash = serializers.state_hash(after)
            execution.impact = self._merge_impact(execution.impact, metrics_after)
            execution.status = ActionExecutionStatus.EXECUTED.value
            execution.executed_at = datetime.now(timezone.utc)
            await self._session.flush()
        except FinArivuException as exc:
            execution.status = ActionExecutionStatus.FAILED.value
            execution.error_code = exc.error_code
            execution.error_message = exc.message[:500]
            await self._session.flush()
            raise ActionError.execution_failed(exc.message) from exc
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Action %s execution failed", execution.id)
            execution.status = ActionExecutionStatus.FAILED.value
            execution.error_code = ActionErrorCode.EXECUTION_FAILED.value
            execution.error_message = "unexpected_error"
            await self._session.flush()
            raise ActionError.execution_failed() from exc

        self._audit(
            user_id,
            action="copilot.action.execute",
            entity_type=definition.entity_type,
            entity_id=str(execution.entity_id) if execution.entity_id else None,
            details={
                "operation": execution.operation,
                "executionId": str(execution.id),
                "source": execution.source,
            },
        )
        await self._session.flush()

        return self._result_from_execution(execution)

    # ════════════════════════════════════════════════════════════════════
    # CANCEL
    # ════════════════════════════════════════════════════════════════════

    async def cancel(
        self,
        user_id: uuid.UUID,
        execution_id: uuid.UUID,
    ) -> ActionResultResponse:
        """Cancel a pending preview — never mutates financial data."""
        execution = await self._repo.get_for_user(user_id, execution_id)
        if execution is None:
            raise ActionError.entity_not_found("action", str(execution_id))
        if execution.status not in (
            ActionExecutionStatus.AWAITING_CONFIRMATION.value,
            ActionExecutionStatus.PREVIEWED.value,
        ):
            raise ActionError(
                ActionErrorCode.INVALID_ACTION,
                f"This action cannot be cancelled (status: {execution.status}).",
                status_code=409,
            )
        execution.status = ActionExecutionStatus.CANCELLED.value
        await self._session.flush()
        self._audit(
            user_id,
            action="copilot.action.cancel",
            entity_type=execution.entity_type,
            entity_id=str(execution.entity_id) if execution.entity_id else None,
            details={"operation": execution.operation, "executionId": str(execution.id)},
        )
        await self._session.flush()
        return self._result_from_execution(execution)

    # ════════════════════════════════════════════════════════════════════
    # UNDO
    # ════════════════════════════════════════════════════════════════════

    async def undo(
        self,
        user_id: uuid.UUID,
        execution_id: uuid.UUID,
    ) -> ActionResultResponse:
        """Reverse a previously executed action when safe.

        Creates → soft-delete the created record (if unchanged since).
        Updates → restore the stored ``before_state`` (if unchanged since).
        """
        execution = await self._repo.get_for_user(user_id, execution_id)
        if execution is None:
            raise ActionError.entity_not_found("action", str(execution_id))
        if execution.status != ActionExecutionStatus.EXECUTED.value:
            raise ActionError.not_reversible()
        if not execution.undo_supported:
            raise ActionError.not_reversible()

        definition = get_action_definition(execution.operation)
        if definition is None or execution.entity_id is None:
            raise ActionError.not_reversible()

        entity = await self._load_entity(definition.entity_type, execution.entity_id)
        if entity is None or getattr(entity, "user_id", None) != user_id:
            raise ActionError.entity_not_found(definition.entity_type, "")

        # The record must still match the post-execution snapshot — undoing
        # over newer user edits would silently destroy data.
        current_hash = serializers.state_hash(
            self._snapshot(definition.entity_type, entity)
        )
        if execution.state_hash and current_hash != execution.state_hash:
            raise ActionError.stale_preview()

        if definition.is_create:
            await self._delete_entity(definition.entity_type, entity)
        else:
            await self._restore_before_state(user_id, definition, execution)

        execution.status = ActionExecutionStatus.UNDONE.value
        execution.undone_at = datetime.now(timezone.utc)
        await self._session.flush()

        self._audit(
            user_id,
            action="copilot.action.undo",
            entity_type=definition.entity_type,
            entity_id=str(execution.entity_id),
            details={"operation": execution.operation, "executionId": str(execution.id)},
        )
        await self._session.flush()
        return self._result_from_execution(execution)

    # ════════════════════════════════════════════════════════════════════
    # HISTORY
    # ════════════════════════════════════════════════════════════════════

    async def history(
        self,
        user_id: uuid.UUID,
        *,
        skip: int = 0,
        limit: int = 50,
        statuses: list[ActionExecutionStatus] | None = None,
    ) -> list[ActionHistoryItem]:
        """Return the user's action history rows."""
        rows = await self._repo.list_for_user(
            user_id,
            skip=skip,
            limit=limit,
            statuses=[s.value for s in statuses] if statuses else None,
        )
        return [
            ActionHistoryItem(
                id=row.id,
                operation=ActionOperation(row.operation),
                status=ActionExecutionStatus(row.status),
                title=row.title,
                entity_name=row.entity_name,
                entity_type=row.entity_type,
                created_at=row.created_at,
                executed_at=row.executed_at,
                undo_available=row.status == ActionExecutionStatus.EXECUTED.value
                and bool(row.undo_supported),
            )
            for row in rows
        ]

    # ════════════════════════════════════════════════════════════════════
    # PREPARATION (resolve + snapshot) per operation
    # ════════════════════════════════════════════════════════════════════

    async def _prepare(
        self,
        user_id: uuid.UUID,
        definition: ActionDefinition,
        args: Any,
    ) -> _Prepared:
        handler = self._PREPARE[definition.operation]
        return await handler(self, user_id, definition, args)

    async def _prepare_create_expense(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: CreateExpenseArgs
    ) -> _Prepared:
        category = await resolvers.resolve_category(
            self._session,
            category_id=args.category_id,
            category_name=args.category_name,
        )
        payload = ExpenseCreate(
            category_id=category.id,
            amount=args.amount,
            expense_date=args.expense_date or date.today(),
            description=args.description,
            payment_method=args.payment_method,
            is_recurring=args.is_recurring,
        )
        after = {
            "amount": float(args.amount),
            "categoryId": str(category.id),
            "categoryName": category.name,
            "description": args.description,
            "expenseDate": payload.expense_date.isoformat(),
            "paymentMethod": args.payment_method,
            "isRecurring": args.is_recurring,
        }
        return _Prepared(
            definition=definition,
            args=args,
            entity=None,
            entity_name=category.name,
            title=f"Add {category.name} expense",
            before=None,
            after=after,
            precondition=None,
            validated_payload={"create": payload.model_dump(by_alias=False, mode="json")},
        )

    async def _prepare_update_expense(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: UpdateExpenseArgs
    ) -> _Prepared:
        expense = await resolvers.resolve_expense(
            self._session,
            user_id,
            expense_id=args.expense_id,
            category_id=None,
            category_name=args.category_name,
            expense_date=args.expense_date,
        )
        before = serializers.expense_snapshot(expense)
        update = ExpenseUpdate(
            amount=args.amount,
            description=args.description,
            expense_date=args.expense_date,
            payment_method=args.payment_method,
            is_recurring=args.is_recurring,
        )
        after = dict(before)
        if args.amount is not None:
            after["amount"] = float(args.amount)
        if args.description is not None:
            after["description"] = args.description
        if args.expense_date is not None:
            after["expenseDate"] = args.expense_date.isoformat()
        if args.payment_method is not None:
            after["paymentMethod"] = args.payment_method
        if args.is_recurring is not None:
            after["isRecurring"] = args.is_recurring
        if args.new_category_name:
            new_cat = await resolvers.resolve_category(
                self._session, category_name=args.new_category_name
            )
            update.category_id = new_cat.id
            after["categoryId"] = str(new_cat.id)
        category = await self._category_label(expense.category_id)
        return _Prepared(
            definition=definition,
            args=args,
            entity=expense,
            entity_name=category,
            title=f"Update {category} expense",
            before=before,
            after=after,
            precondition=before,
            validated_payload={"update": update.model_dump(exclude_unset=True, by_alias=False, mode="json")},
        )

    async def _prepare_create_budget(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: CreateBudgetArgs
    ) -> _Prepared:
        category = await resolvers.resolve_category(
            self._session,
            category_id=args.category_id,
            category_name=args.category_name,
        )
        existing = await self._budgets._repo.get_by_user_and_category(
            user_id, category.id
        )
        if existing is not None:
            raise ActionError(
                ActionErrorCode.INVALID_ARGUMENTS,
                f"A budget already exists for {category.name}. "
                "I can update it instead.",
                status_code=409,
                details={"existingBudgetId": str(existing.id)},
            )
        payload = BudgetCreate(
            category_id=category.id,
            monthly_limit=args.monthly_limit,
            period=args.period,
        )
        after = {
            "monthlyLimit": float(args.monthly_limit),
            "period": args.period.value,
            "categoryId": str(category.id),
            "categoryName": category.name,
        }
        return _Prepared(
            definition=definition,
            args=args,
            entity=None,
            entity_name=category.name,
            title=f"Create {category.name} budget",
            before=None,
            after=after,
            # Staleness guard: no budget may exist for this category.
            precondition={"categoryBudgetExists": False, "categoryId": str(category.id)},
            validated_payload={"create": payload.model_dump(by_alias=False, mode="json")},
        )

    async def _prepare_update_budget(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: UpdateBudgetArgs
    ) -> _Prepared:
        budget = await resolvers.resolve_budget(
            self._session,
            user_id,
            budget_id=args.budget_id,
            category_id=args.category_id,
            category_name=args.category_name,
        )
        before = serializers.budget_snapshot(budget)
        update = BudgetUpdate(monthly_limit=args.monthly_limit, period=args.period)
        after = dict(before)
        if args.monthly_limit is not None:
            after["monthlyLimit"] = float(args.monthly_limit)
        if args.period is not None:
            after["period"] = args.period.value
        category = await self._category_label(budget.category_id)
        return _Prepared(
            definition=definition,
            args=args,
            entity=budget,
            entity_name=category,
            title=f"Update {category} budget",
            before=before,
            after=after,
            precondition=before,
            validated_payload={"update": update.model_dump(exclude_unset=True, by_alias=False, mode="json")},
        )

    async def _prepare_create_goal(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: CreateGoalArgs
    ) -> _Prepared:
        payload = GoalCreate(
            goal_name=args.goal_name,
            target_amount=args.target_amount,
            current_amount=args.current_amount,
            target_date=args.target_date,
            priority=args.priority,
            description=args.description,
        )
        after = {
            "goalName": args.goal_name,
            "targetAmount": float(args.target_amount),
            "currentAmount": float(args.current_amount),
            "targetDate": args.target_date.isoformat() if args.target_date else None,
            "priority": args.priority.value,
            "description": args.description,
        }
        return _Prepared(
            definition=definition,
            args=args,
            entity=None,
            entity_name=args.goal_name,
            title=f"Create {args.goal_name} goal",
            before=None,
            after=after,
            precondition=None,
            validated_payload={"create": payload.model_dump(by_alias=False, mode="json")},
        )

    async def _prepare_update_goal(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: UpdateGoalArgs
    ) -> _Prepared:
        goal = await resolvers.resolve_goal(
            self._session,
            user_id,
            goal_id=args.goal_id,
            goal_name=args.goal_name,
        )
        before = serializers.goal_snapshot(goal)
        update = GoalUpdate(
            goal_name=args.new_goal_name,
            target_amount=args.target_amount,
            current_amount=args.current_amount,
            target_date=args.target_date,
            priority=args.priority,
            description=args.description,
        )
        after = dict(before)
        if args.new_goal_name is not None:
            after["goalName"] = args.new_goal_name
        if args.target_amount is not None:
            after["targetAmount"] = float(args.target_amount)
        if args.current_amount is not None:
            after["currentAmount"] = float(args.current_amount)
        if args.target_date is not None:
            after["targetDate"] = args.target_date.isoformat()
        if args.priority is not None:
            after["priority"] = args.priority.value
        if args.description is not None:
            after["description"] = args.description
        return _Prepared(
            definition=definition,
            args=args,
            entity=goal,
            entity_name=goal.goal_name,
            title=f"Update {goal.goal_name} goal",
            before=before,
            after=after,
            precondition=before,
            validated_payload={"update": update.model_dump(exclude_unset=True, by_alias=False, mode="json")},
        )

    async def _prepare_create_income(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: CreateIncomeArgs
    ) -> _Prepared:
        payload = IncomeCreate(
            amount=args.amount,
            source=args.source,
            income_date=args.income_date or date.today(),
            description=args.description,
            is_recurring=args.is_recurring,
            is_primary=args.is_primary,
            frequency=args.frequency,
        )
        after = {
            "amount": float(args.amount),
            "source": args.source,
            "incomeDate": payload.income_date.isoformat(),
            "description": args.description,
            "isRecurring": args.is_recurring,
            "isPrimary": args.is_primary,
            "frequency": args.frequency,
        }
        return _Prepared(
            definition=definition,
            args=args,
            entity=None,
            entity_name=args.source,
            title=f"Add {args.source} income",
            before=None,
            after=after,
            precondition=None,
            validated_payload={"create": payload.model_dump(by_alias=False, mode="json")},
        )

    async def _prepare_update_income(
        self, user_id: uuid.UUID, definition: ActionDefinition, args: UpdateIncomeArgs
    ) -> _Prepared:
        income = await resolvers.resolve_income(
            self._session,
            user_id,
            income_id=args.income_id,
            source=args.source,
        )
        before = serializers.income_snapshot(income)
        update = IncomeUpdate(
            amount=args.amount,
            source=args.new_source,
            income_date=args.income_date,
            description=args.description,
            is_recurring=args.is_recurring,
            is_primary=args.is_primary,
            frequency=args.frequency,
        )
        after = dict(before)
        if args.amount is not None:
            after["amount"] = float(args.amount)
        if args.new_source is not None:
            after["source"] = args.new_source
        if args.income_date is not None:
            after["incomeDate"] = args.income_date.isoformat()
        if args.description is not None:
            after["description"] = args.description
        if args.is_recurring is not None:
            after["isRecurring"] = args.is_recurring
        if args.is_primary is not None:
            after["isPrimary"] = args.is_primary
        if args.frequency is not None:
            after["frequency"] = args.frequency
        return _Prepared(
            definition=definition,
            args=args,
            entity=income,
            entity_name=income.source,
            title=f"Update {income.source} income",
            before=before,
            after=after,
            precondition=before,
            validated_payload={"update": update.model_dump(exclude_unset=True, by_alias=False, mode="json")},
        )

    _PREPARE = {
        ActionOperation.CREATE_EXPENSE: _prepare_create_expense,
        ActionOperation.UPDATE_EXPENSE: _prepare_update_expense,
        ActionOperation.CREATE_BUDGET: _prepare_create_budget,
        ActionOperation.UPDATE_BUDGET: _prepare_update_budget,
        ActionOperation.CREATE_GOAL: _prepare_create_goal,
        ActionOperation.UPDATE_GOAL: _prepare_update_goal,
        ActionOperation.CREATE_INCOME: _prepare_create_income,
        ActionOperation.UPDATE_INCOME: _prepare_update_income,
    }

    # ════════════════════════════════════════════════════════════════════
    # APPLY / UNDO via domain services
    # ════════════════════════════════════════════════════════════════════

    async def _apply(
        self,
        user_id: uuid.UUID,
        definition: ActionDefinition,
        execution: CopilotActionExecution,
    ) -> Any:
        """Execute the validated payload through the domain service."""
        payload = execution.validated_payload
        entity_id = execution.entity_id

        if definition.operation == ActionOperation.CREATE_EXPENSE:
            return await self._expenses.create_for_user(
                user_id, ExpenseCreate.model_validate(payload["create"])
            )
        if definition.operation == ActionOperation.UPDATE_EXPENSE:
            return await self._expenses.update_for_user(
                user_id, entity_id, ExpenseUpdate.model_validate(payload["update"])
            )
        if definition.operation == ActionOperation.CREATE_BUDGET:
            return await self._budgets.create_for_user(
                user_id, BudgetCreate.model_validate(payload["create"])
            )
        if definition.operation == ActionOperation.UPDATE_BUDGET:
            return await self._budgets.update_for_user(
                user_id, entity_id, BudgetUpdate.model_validate(payload["update"])
            )
        if definition.operation == ActionOperation.CREATE_GOAL:
            return await self._goals.create_for_user(
                user_id, GoalCreate.model_validate(payload["create"])
            )
        if definition.operation == ActionOperation.UPDATE_GOAL:
            return await self._goals.update_for_user(
                user_id, entity_id, GoalUpdate.model_validate(payload["update"])
            )
        if definition.operation == ActionOperation.CREATE_INCOME:
            return await self._income.create_for_user(
                user_id, IncomeCreate.model_validate(payload["create"])
            )
        if definition.operation == ActionOperation.UPDATE_INCOME:
            return await self._income.update_for_user(
                user_id, entity_id, IncomeUpdate.model_validate(payload["update"])
            )
        raise ActionError.invalid_action(execution.operation)

    async def _restore_before_state(
        self,
        user_id: uuid.UUID,
        definition: ActionDefinition,
        execution: CopilotActionExecution,
    ) -> None:
        """Undo an update by restoring the stored before_state."""
        before = execution.before_state or {}
        entity_id = execution.entity_id
        if entity_id is None:
            raise ActionError.not_reversible()

        if definition.entity_type == "expense":
            await self._expenses.update_for_user(
                user_id, entity_id, ExpenseUpdate.model_validate(before)
            )
        elif definition.entity_type == "budget":
            await self._budgets.update_for_user(
                user_id,
                entity_id,
                BudgetUpdate(
                    monthly_limit=before.get("monthlyLimit"),
                    period=before.get("period"),
                ),
            )
        elif definition.entity_type == "goal":
            await self._goals.update_for_user(
                user_id, entity_id, GoalUpdate.model_validate(before)
            )
        elif definition.entity_type == "income":
            await self._income.update_for_user(
                user_id, entity_id, IncomeUpdate.model_validate(before)
            )
        else:
            raise ActionError.not_reversible()

    # ════════════════════════════════════════════════════════════════════
    # Staleness / snapshots / engine impact
    # ════════════════════════════════════════════════════════════════════

    async def _assert_not_stale(
        self,
        user_id: uuid.UUID,
        execution: CopilotActionExecution,
        definition: ActionDefinition,
    ) -> None:
        """Verify the entity state matches what the preview assumed."""
        stored = execution.state_hash
        if stored is None:
            return

        if definition.is_create:
            # Create preconditions (e.g. "no budget for this category") are
            # recomputed from the validated payload and hash-compared.
            pre = await self._create_precondition(user_id, definition, execution)
            if pre is not None and serializers.state_hash(pre) != stored:
                raise ActionError.stale_preview()
            return

        if execution.entity_id is None:
            raise ActionError.stale_preview()
        entity = await self._load_entity(definition.entity_type, execution.entity_id)
        if entity is None or getattr(entity, "user_id", None) != user_id:
            raise ActionError.entity_not_found(definition.entity_type, "")
        current = serializers.state_hash(
            self._snapshot(definition.entity_type, entity)
        )
        if current != stored:
            raise ActionError.stale_preview()

    async def _create_precondition(
        self,
        user_id: uuid.UUID,
        definition: ActionDefinition,
        execution: CopilotActionExecution,
    ) -> dict[str, Any] | None:
        """Recompute the create-time precondition for staleness checks."""
        if definition.operation == ActionOperation.CREATE_BUDGET:
            category_id = (execution.validated_payload or {}).get("create", {}).get("category_id")
            if not category_id:
                return None
            existing = await self._budgets._repo.get_by_user_and_category(
                user_id, uuid.UUID(str(category_id))
            )
            return {
                "categoryBudgetExists": existing is not None,
                "categoryId": str(category_id),
            }
        return None

    async def _load_entity(self, entity_type: str, entity_id: uuid.UUID) -> Any | None:
        repos = {
            "expense": self._expenses._repo,
            "budget": self._budgets._repo,
            "goal": self._goals._repo,
            "income": self._income._repo,
        }
        repo = repos.get(entity_type)
        return await repo.get_by_id(entity_id) if repo else None

    async def _delete_entity(self, entity_type: str, entity: Any) -> None:
        services = {
            "expense": self._expenses,
            "budget": self._budgets,
            "goal": self._goals,
            "income": self._income,
        }
        service = services.get(entity_type)
        if service is None:
            raise ActionError.not_reversible()
        await service.delete_for_user(entity.user_id, entity.id)

    def _snapshot(self, entity_type: str, entity: Any) -> dict[str, Any]:
        if entity_type == "expense":
            return serializers.expense_snapshot(entity)
        if entity_type == "budget":
            return serializers.budget_snapshot(entity)
        if entity_type == "goal":
            return serializers.goal_snapshot(entity)
        return serializers.income_snapshot(entity)

    def _precondition_hash(self, prepared: _Prepared) -> str | None:
        if prepared.precondition is None:
            return None
        return serializers.state_hash(prepared.precondition)

    async def _category_label(self, category_id: uuid.UUID) -> str:
        category = await ExpenseCategoryRepository(self._session).get_by_id(category_id)
        return category.name if category else "Expense"

    # ── Deterministic engine impact ─────────────────────────────────────

    async def _engine_metrics(
        self,
        user_id: uuid.UUID,
        definition: ActionDefinition,
        prepared: _Prepared,
    ) -> dict[str, Any]:
        """Read-only engine metrics about the CURRENT state for the entity."""
        try:
            if definition.entity_type in ("expense", "budget"):
                category_id = (
                    prepared.after.get("categoryId")
                    if prepared.after
                    else None
                ) or (prepared.before or {}).get("categoryId")
                if category_id:
                    return await self._budget_metrics(user_id, uuid.UUID(str(category_id)))
            if definition.entity_type == "goal" and prepared.entity is not None:
                return await self._goal_metrics(user_id, prepared.entity.id)
            if definition.entity_type == "income":
                return await self._cashflow_metrics(user_id)
        except Exception:
            logger.warning("Engine metrics unavailable for %s", definition.operation)
        return {}

    async def _engine_metrics_for_entity(
        self,
        user_id: uuid.UUID,
        definition: ActionDefinition,
        entity: Any,
    ) -> dict[str, Any]:
        """Post-execution engine metrics — reads the real updated state."""
        try:
            if definition.entity_type in ("expense", "budget"):
                return await self._budget_metrics(user_id, entity.category_id)
            if definition.entity_type == "goal":
                return await self._goal_metrics(user_id, entity.id)
            if definition.entity_type == "income":
                return await self._cashflow_metrics(user_id)
        except Exception:
            logger.warning("Post-execution metrics unavailable for %s", definition.operation)
        return {}

    async def _budget_metrics(self, user_id: uuid.UUID, category_id: uuid.UUID) -> dict:
        analysis = await BudgetEngine.analyze(self._session, user_id)
        for cat in analysis.categories:
            if cat.category_id == category_id:
                return {
                    "budget": float(cat.budget),
                    "spent": float(cat.spent),
                    "remainingBudget": float(cat.budget - cat.spent),
                    "usagePercent": float(cat.usage),
                }
        return {}

    async def _goal_metrics(self, user_id: uuid.UUID, goal_id: uuid.UUID) -> dict:
        projections = await GoalEngine.analyze(self._session, user_id)
        for goal in projections.goals:
            if goal.goal_id == goal_id:
                return {
                    "monthlyContribution": float(goal.monthly_contribution),
                    "monthsRemaining": goal.months_remaining,
                    "completionPercentage": float(goal.completion_percentage),
                    "goalStatus": goal.status,
                }
        return {}

    async def _cashflow_metrics(self, user_id: uuid.UUID) -> dict:
        flow = await CashFlowEngine.analyze(self._session, user_id)
        return {
            "totalIncome": flow.total_income,
            "totalExpenses": flow.total_expenses,
            "savings": flow.savings,
            "savingsRate": round(flow.savings_rate, 4),
        }

    @staticmethod
    def _arithmetic_impact(
        definition: ActionDefinition, prepared: _Prepared
    ) -> dict[str, Any]:
        """Honest deltas computed from before/after — never projected."""
        impact: dict[str, Any] = {}
        before = prepared.before or {}
        after = prepared.after or {}

        def delta(key: str, out_key: str) -> None:
            b, a = before.get(key), after.get(key)
            if isinstance(b, (int, float, Decimal)) and isinstance(a, (int, float, Decimal)):
                impact[out_key] = float(a) - float(b)

        if definition.entity_type == "budget":
            delta("monthlyLimit", "monthlyBudgetChange")
        elif definition.entity_type == "goal":
            delta("targetAmount", "targetAmountChange")
            delta("currentAmount", "currentAmountChange")
        elif definition.entity_type == "expense":
            delta("amount", "amountChange")
            if prepared.entity is None and after.get("amount") is not None:
                impact["amountAdded"] = float(after["amount"])
        elif definition.entity_type == "income":
            delta("amount", "amountChange")
            if prepared.entity is None and after.get("amount") is not None:
                impact["amountAdded"] = float(after["amount"])
        return impact

    @staticmethod
    def _merge_impact(before_metrics: Any, after_metrics: dict[str, Any]) -> dict[str, Any]:
        """Merge preview-time and post-execution engine metrics."""
        merged: dict[str, Any] = {}
        if isinstance(before_metrics, dict):
            merged["before"] = before_metrics
        if after_metrics:
            merged["after"] = after_metrics
        return merged

    # ── Helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _preview_ttl() -> Any:
        from datetime import timedelta

        return timedelta(seconds=settings.action_preview_ttl_seconds)

    @staticmethod
    def _missing_required(definition: ActionDefinition, raw: dict) -> list[str]:
        missing: list[str] = []
        for field_name in definition.required_fields:
            value = raw.get(field_name) or raw.get(to_camel(field_name))
            if value is None or value == "":
                missing.append(field_name)
        return missing

    @staticmethod
    def _clarification_for(
        definition: ActionDefinition, missing: list[str]
    ) -> str:
        prompts = {
            "amount": "What amount should I use?",
            "category_name": "Which category should I use?",
            "categoryName": "Which category should I use?",
            "monthly_limit": "What monthly limit would you like?",
            "monthlyLimit": "What monthly limit would you like?",
            "goal_name": "What should I call this goal?",
            "goalName": "What should I call this goal?",
            "target_amount": "What is the target amount?",
            "targetAmount": "What is the target amount?",
            "source": "Which income source should I use?",
            "expense_id": "Which expense should I update?",
            "budget_id": "Which budget should I update?",
            "goal_id": "Which goal should I update?",
            "income_id": "Which income record should I update?",
        }
        questions = [prompts.get(f, f"Please provide {f}.") for f in missing]
        return " ".join(questions)

    def _audit(
        self,
        user_id: uuid.UUID,
        *,
        action: str,
        entity_type: str | None,
        entity_id: str | None,
        details: dict[str, Any],
    ) -> None:
        """Append an audit row — safe metadata only, no sensitive values."""
        self._session.add(
            AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details,
            )
        )

    @staticmethod
    def _result_from_execution(
        execution: CopilotActionExecution,
    ) -> ActionResultResponse:
        message = {
            ActionExecutionStatus.EXECUTED.value: "Done — the change was applied.",
            ActionExecutionStatus.CANCELLED.value: "Cancelled — nothing was changed.",
            ActionExecutionStatus.UNDONE.value: "Undone — the change was reverted.",
            ActionExecutionStatus.EXPIRED.value: "This action preview expired.",
            ActionExecutionStatus.FAILED.value: "The action could not be completed.",
        }.get(execution.status, "")
        return ActionResultResponse(
            execution_id=execution.id,
            status=ActionExecutionStatus(execution.status),
            operation=ActionOperation(execution.operation),
            title=execution.title,
            entity_name=execution.entity_name,
            result={
                "entityId": str(execution.entity_id) if execution.entity_id else None,
                "before": execution.before_state,
                "after": execution.after_state,
            },
            impact=execution.impact or {},
            affected_areas=execution.affected_areas or [],
            undo_available=execution.status == ActionExecutionStatus.EXECUTED.value
            and bool(execution.undo_supported),
            message=execution.error_message or message,
        )
