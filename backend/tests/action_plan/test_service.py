"""FinancialActionPlanService tests — generation, lifecycle, reconciliation."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
import pytest_asyncio
from sqlalchemy import func, select

from app.action_plan.errors import PlanError
from app.action_plan.plan_types import PlanItemStatus, can_transition
from app.action_plan.service import FinancialActionPlanService
from app.models.action_plan import (
    FinancialActionPlan,
    FinancialPlanItem as PlanItemRow,
)
from app.models.assets import Asset
from app.models.budgets import Budget
from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.income import Income
from app.models.liabilities import Liability
from app.models.profiles import Profile


def _prior_month_date(today: date, months_back: int, day: int = 15) -> date:
    month = today.month - months_back
    year = today.year
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, min(day, 28))


@pytest_asyncio.fixture
async def seeded_category(db_session):
    cat = ExpenseCategory(name="Dining", is_system=False, display_order=97)
    db_session.add(cat)
    await db_session.flush()
    return cat


@pytest_asyncio.fixture
async def plan_user(db_session, test_user, seeded_category):
    """User whose data triggers multiple actionable radar insights."""
    today = date.today()
    db_session.add(
        Profile(
            user_id=test_user.id, age=30, retirement_age=60,
            monthly_income=80000, employment_type="salaried",
        )
    )
    db_session.add(
        Income(
            user_id=test_user.id, amount=80000, source="Salary",
            income_date=today, is_recurring=True, is_primary=True,
        )
    )
    for mb in (1, 2, 3):
        db_session.add(
            Expense(
                user_id=test_user.id, category_id=seeded_category.id,
                amount=20000, expense_date=_prior_month_date(today, mb),
            )
        )
    db_session.add(
        Expense(
            user_id=test_user.id, category_id=seeded_category.id,
            amount=25000, expense_date=today,
        )
    )
    db_session.add(
        Budget(
            user_id=test_user.id, category_id=seeded_category.id,
            monthly_limit=15000, period="monthly",
        )
    )
    db_session.add(
        Asset(
            user_id=test_user.id, asset_type="Cash", name="EF",
            value=30000, is_emergency_fund=True, savings_bucket="emergency",
        )
    )
    db_session.add(
        Liability(
            user_id=test_user.id, liability_type="Personal Loan",
            name="Loan", amount=400000, interest_rate=15.0, emi=15000,
        )
    )
    await db_session.flush()
    return test_user


class TestGeneration:
    async def test_generates_plan_from_radar(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        assert plan.active_count > 0
        assert plan.items
        assert plan.plan_version == "action_plan_v1"
        # Every item carries evidence + provenance.
        for item in plan.items:
            assert item.evidence
            assert item.source_insight_id is not None
            assert item.why

    async def test_plan_is_idempotent(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        first = await service.get_or_generate_current(plan_user.id)
        second = await service.get_or_generate_current(plan_user.id)
        assert first.id == second.id
        assert second.active_count == first.active_count
        # No duplicate rows.
        rows = (
            await db_session.execute(
                select(func.count())
                .select_from(PlanItemRow)
                .where(PlanItemRow.user_id == plan_user.id)
            )
        ).scalar()
        assert rows == first.active_count

    async def test_respects_max_items(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        assert plan.active_count <= 5

    async def test_empty_user_gets_all_clear(self, db_session, test_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(test_user.id)
        assert plan.active_count == 0
        assert "on track" in plan.summary.lower()

    async def test_one_plan_per_period(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        await service.get_or_generate_current(plan_user.id)
        await service.get_or_generate_current(plan_user.id, force_rescan=True)
        count = (
            await db_session.execute(
                select(func.count())
                .select_from(FinancialActionPlan)
                .where(FinancialActionPlan.user_id == plan_user.id)
            )
        ).scalar()
        assert count == 1

    async def test_plan_never_mutates_financials(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        for model in (Expense, Income, Budget, Asset, Liability):
            before = (
                await db_session.execute(
                    select(func.count()).select_from(model)
                    .where(model.user_id == plan_user.id)
                )
            ).scalar()
            await service.get_or_generate_current(plan_user.id, force_rescan=True)
            after = (
                await db_session.execute(
                    select(func.count()).select_from(model)
                    .where(model.user_id == plan_user.id)
                )
            ).scalar()
            assert before == after


class TestLifecycle:
    async def test_transition_rules(self):
        assert can_transition("PENDING", "IN_PROGRESS")
        assert can_transition("IN_PROGRESS", "COMPLETED")
        assert can_transition("PENDING", "SNOOZED")
        assert can_transition("SNOOZED", "PENDING")
        assert can_transition("PENDING", "DISMISSED")
        assert not can_transition("COMPLETED", "PENDING")
        assert not can_transition("DISMISSED", "PENDING")
        assert not can_transition("PENDING", "PENDING")

    async def test_accept_then_complete(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        item = plan.items[0]
        accepted = await service.accept_item(plan_user.id, item.id)
        assert accepted.status == "IN_PROGRESS"
        done = await service.complete_item(plan_user.id, item.id)
        assert done.status == "COMPLETED"
        assert done.completion_source == "USER"

    async def test_complete_is_terminal(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        item = plan.items[0]
        await service.complete_item(plan_user.id, item.id)
        with pytest.raises(PlanError):
            await service.complete_item(plan_user.id, item.id)
        with pytest.raises(PlanError):
            await service.accept_item(plan_user.id, item.id)

    async def test_snooze_and_revive(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        item = plan.items[0]
        snoozed = await service.snooze_item(plan_user.id, item.id, "TOMORROW")
        assert snoozed.status == "SNOOZED"
        assert snoozed.snoozed_until is not None

        # Expire the snooze — the condition persists, so it returns to PENDING.
        row = await service._items.get_for_user(plan_user.id, item.id)
        row.snoozed_until = datetime.now(timezone.utc) - timedelta(hours=1)
        await db_session.flush()
        plan2 = await service.get_or_generate_current(plan_user.id)
        revived = next(i for i in plan2.items if i.id == item.id)
        assert revived.status == "PENDING"

    async def test_dismiss_is_terminal_and_persisted(
        self, db_session, plan_user
    ):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        item = plan.items[0]
        dismissed = await service.dismiss_item(plan_user.id, item.id)
        assert dismissed.status == "DISMISSED"
        with pytest.raises(PlanError):
            await service.dismiss_item(plan_user.id, item.id)

        # Regeneration must not resurrect the dismissed fingerprint.
        plan2 = await service.get_or_generate_current(
            plan_user.id, force_rescan=True
        )
        target = next(i for i in plan2.items if i.id == item.id)
        assert target.status == "DISMISSED"

    async def test_invalid_snooze_option(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        with pytest.raises(PlanError):
            await service.snooze_item(plan_user.id, plan.items[0].id, "YEAR_3000")


class TestReconciliation:
    async def test_resolved_source_completes_item(self, db_session, plan_user):
        """Fix the underlying condition → item reconciles to COMPLETED."""
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        budget_item = next(
            (i for i in plan.items if i.category == "REVIEW_BUDGET"), None
        )
        assert budget_item is not None

        budget = (
            await db_session.execute(
                select(Budget).where(Budget.user_id == plan_user.id)
            )
        ).scalar_one()
        budget.monthly_limit = Decimal("200000")
        await db_session.flush()

        plan2 = await service.get_or_generate_current(
            plan_user.id, force_rescan=True
        )
        target = next(i for i in plan2.items if i.id == budget_item.id)
        assert target.status == "COMPLETED"
        assert target.completion_source == "SYSTEM_RECONCILIATION"

    async def test_add_insight_to_plan(self, db_session, plan_user):
        """Radar → Plan bridge dedups an already-present fingerprint."""
        service = FinancialActionPlanService(db_session)
        summary = await service._radar.scan(plan_user.id)
        insight = summary.insights[0]

        item = await service.add_insight_item(plan_user.id, insight.id)
        assert item.source_insight_id == insight.id

        # Second add returns the same row — no duplicate.
        again = await service.add_insight_item(plan_user.id, insight.id)
        assert again.id == item.id


class TestScoping:
    async def test_cross_user_access_blocked(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        plan = await service.get_or_generate_current(plan_user.id)
        item = plan.items[0]
        other = uuid.uuid4()
        with pytest.raises(PlanError):
            await service.get_item(other, item.id)
        with pytest.raises(PlanError):
            await service.dismiss_item(other, item.id)
        with pytest.raises(PlanError):
            await service.complete_item(other, item.id)
        with pytest.raises(PlanError):
            await service.get_plan(other, plan.id)

    async def test_history_scoped(self, db_session, plan_user):
        service = FinancialActionPlanService(db_session)
        await service.get_or_generate_current(plan_user.id)
        history = await service.get_history(uuid.uuid4())
        assert history == []
