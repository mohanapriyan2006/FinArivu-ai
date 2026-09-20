"""Typed contracts for the Copilot action system.

Two layers of models:

* ``*Args`` — the arguments extracted from a proposal or sent by the
  client. References may be names (``category_name``, ``goal_name``,
  ``source``) or ids; resolvers turn names into user-owned entities.
* Wire models — ``ActionProposal``, ``ActionPreviewRequest``,
  ``ActionPreviewResponse``, ``ActionExecuteRequest``,
  ``ActionResultResponse``, ``ActionHistoryItem``.

All models serialise camelCase via ``BaseSchema``.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import ConfigDict, Field, field_validator, model_validator

from app.actions.action_types import (
    ActionExecutionStatus,
    ActionOperation,
    ActionPreviewStatus,
    ActionSource,
)
from app.constants import BudgetPeriod, GoalPriority, PaymentMethod
from app.schemas.base import BaseSchema, to_camel


# ── Action argument models ────────────────────────────────────────────────


class _ResolvableArgs(BaseSchema):
    """Base for argument models carrying resolvable references."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
        alias_generator=to_camel,
        ser_json_by_alias=True,
        extra="ignore",
    )


class CreateExpenseArgs(_ResolvableArgs):
    """Arguments for CREATE_EXPENSE."""

    category_id: UUID | None = None
    category_name: str | None = Field(default=None, max_length=255)
    amount: Decimal = Field(..., gt=0, le=Decimal("9999999999999.99"))
    expense_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)
    payment_method: str | None = Field(default=None, max_length=100)
    is_recurring: bool = False

    @field_validator("payment_method")
    @classmethod
    def _normalise_payment_method(cls, v: str | None) -> str | None:
        if v is None:
            return v
        for m in PaymentMethod:
            if m.value.lower() == v.strip().lower():
                return m.value
        return PaymentMethod.OTHER.value


class UpdateExpenseArgs(_ResolvableArgs):
    """Arguments for UPDATE_EXPENSE. Exactly one of expense_id or a
    resolvable reference (category_name + optional expense_date) is needed."""

    expense_id: UUID | None = None
    category_name: str | None = Field(default=None, max_length=255)
    expense_date: date | None = None
    amount: Decimal | None = Field(default=None, gt=0, le=Decimal("9999999999999.99"))
    description: str | None = Field(default=None, max_length=1000)
    payment_method: str | None = Field(default=None, max_length=100)
    is_recurring: bool | None = None
    new_category_name: str | None = Field(default=None, max_length=100)

    @field_validator("payment_method")
    @classmethod
    def _normalise_payment_method(cls, v: str | None) -> str | None:
        if v is None:
            return v
        for m in PaymentMethod:
            if m.value.lower() == v.strip().lower():
                return m.value
        return PaymentMethod.OTHER.value


class CreateBudgetArgs(_ResolvableArgs):
    """Arguments for CREATE_BUDGET."""

    category_id: UUID | None = None
    category_name: str | None = Field(default=None, max_length=255)
    monthly_limit: Decimal = Field(..., gt=0, le=Decimal("9999999999999.99"))
    period: BudgetPeriod = BudgetPeriod.MONTHLY


class UpdateBudgetArgs(_ResolvableArgs):
    """Arguments for UPDATE_BUDGET — target budget by id or category."""

    budget_id: UUID | None = None
    category_id: UUID | None = None
    category_name: str | None = Field(default=None, max_length=255)
    monthly_limit: Decimal | None = Field(default=None, gt=0, le=Decimal("9999999999999.99"))
    period: BudgetPeriod | None = None

    @model_validator(mode="after")
    def _require_change(self) -> "UpdateBudgetArgs":
        if self.monthly_limit is None and self.period is None:
            raise ValueError("UPDATE_BUDGET requires monthly_limit or period")
        return self


class CreateGoalArgs(_ResolvableArgs):
    """Arguments for CREATE_GOAL."""

    goal_name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., gt=0, le=Decimal("9999999999999.99"))
    current_amount: Decimal = Field(default=Decimal("0"), ge=0)
    target_date: date | None = None
    priority: GoalPriority = GoalPriority.MEDIUM
    description: str | None = Field(default=None, max_length=1000)


class UpdateGoalArgs(_ResolvableArgs):
    """Arguments for UPDATE_GOAL — target goal by id or name."""

    goal_id: UUID | None = None
    goal_name: str | None = Field(default=None, max_length=255)
    new_goal_name: str | None = Field(default=None, max_length=255)
    target_amount: Decimal | None = Field(default=None, gt=0)
    current_amount: Decimal | None = Field(default=None, ge=0)
    target_date: date | None = None
    priority: GoalPriority | None = None
    description: str | None = Field(default=None, max_length=1000)


class CreateIncomeArgs(_ResolvableArgs):
    """Arguments for CREATE_INCOME. ``source`` must map to IncomeSource."""

    amount: Decimal = Field(..., gt=0, le=Decimal("9999999999999.99"))
    source: str = Field(..., min_length=1, max_length=255)
    income_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)
    is_recurring: bool = False
    is_primary: bool = False
    frequency: str | None = Field(default=None, max_length=50)

    @field_validator("source")
    @classmethod
    def _normalise_source(cls, v: str) -> str:
        from app.constants import IncomeSource

        for s in IncomeSource:
            if s.value.lower() == v.strip().lower():
                return s.value
        return "Other"


class UpdateIncomeArgs(_ResolvableArgs):
    """Arguments for UPDATE_INCOME — target income by id or source."""

    income_id: UUID | None = None
    source: str | None = Field(default=None, max_length=255)
    amount: Decimal | None = Field(default=None, gt=0)
    new_source: str | None = Field(default=None, max_length=255)
    income_date: date | None = None
    description: str | None = Field(default=None, max_length=1000)
    is_recurring: bool | None = None
    is_primary: bool | None = None
    frequency: str | None = Field(default=None, max_length=50)

    @field_validator("source", "new_source")
    @classmethod
    def _normalise_source(cls, v: str | None) -> str | None:
        if v is None:
            return v
        from app.constants import IncomeSource

        for s in IncomeSource:
            if s.value.lower() == v.strip().lower():
                return s.value
        return v.strip()


# Map every operation to its argument model — single source of truth.
ACTION_ARG_SCHEMAS: dict[ActionOperation, type[_ResolvableArgs]] = {
    ActionOperation.CREATE_EXPENSE: CreateExpenseArgs,
    ActionOperation.UPDATE_EXPENSE: UpdateExpenseArgs,
    ActionOperation.CREATE_BUDGET: CreateBudgetArgs,
    ActionOperation.UPDATE_BUDGET: UpdateBudgetArgs,
    ActionOperation.CREATE_GOAL: CreateGoalArgs,
    ActionOperation.UPDATE_GOAL: UpdateGoalArgs,
    ActionOperation.CREATE_INCOME: CreateIncomeArgs,
    ActionOperation.UPDATE_INCOME: UpdateIncomeArgs,
}


# ── Proposal (LLM / extractor output — never trusted blindly) ─────────────


class ActionProposal(BaseSchema):
    """Structured action proposal produced by the controller or the
    deterministic extractor. NOT an execution — it still requires
    validation, preview and explicit user confirmation."""

    operation: str = ""
    arguments: dict[str, Any] = Field(default_factory=dict)
    reason: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    missing_fields: list[str] = Field(default_factory=list)


# ── Wire request/response models ──────────────────────────────────────────


class ActionPreviewRequest(BaseSchema):
    """Client request to preview an action — may come from an API_ACTION
    chip or an explicit request. The backend re-validates everything."""

    operation: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    session_id: str | None = Field(default=None, max_length=255)


class ActionExecuteRequest(BaseSchema):
    """Confirmation of a server-created preview. The client may NOT send
    a fresh action payload here — only the execution id."""

    execution_id: UUID
    confirmation: Literal[True] = True
    session_id: str | None = Field(default=None, max_length=255)


class ActionPreviewResponse(BaseSchema):
    """Preview of a validated action. Nothing is mutated."""

    execution_id: UUID | None = None
    operation: ActionOperation | None = None
    status: ActionPreviewStatus
    title: str = ""
    entity_name: str = ""
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    impact: dict[str, Any] = Field(default_factory=dict)
    affected_areas: list[str] = Field(default_factory=list)
    requires_confirmation: bool = True
    expires_at: datetime | None = None
    missing_fields: list[str] = Field(default_factory=list)
    clarification_question: str | None = None
    reason: str = ""


class ActionResultResponse(BaseSchema):
    """Canonical action result — stored fact, calculated impact, artifact."""

    execution_id: UUID
    status: ActionExecutionStatus
    operation: ActionOperation
    title: str = ""
    entity_name: str = ""
    result: dict[str, Any] = Field(default_factory=dict)
    impact: dict[str, Any] = Field(default_factory=dict)
    affected_areas: list[str] = Field(default_factory=list)
    undo_available: bool = False
    message: str = ""


class ActionHistoryItem(BaseSchema):
    """Compact action-history row for the Copilot UI."""

    id: UUID
    operation: ActionOperation
    status: ActionExecutionStatus
    title: str = ""
    entity_name: str = ""
    entity_type: str | None = None
    created_at: datetime | None = None
    executed_at: datetime | None = None
    undo_available: bool = False
