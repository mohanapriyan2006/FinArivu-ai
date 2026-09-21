"""MoneyRadarService tests — scan, dedup, lifecycle, scoping, safety."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

import pytest
import pytest_asyncio
from sqlalchemy import func, select

from app.models.assets import Asset
from app.models.budgets import Budget
from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.goals import Goal
from app.models.income import Income
from app.models.liabilities import Liability
from app.models.money_radar import RadarInsight as RadarInsightRow
from app.models.profiles import Profile
from app.money_radar.errors import RadarError
from app.money_radar.service import MoneyRadarService


def _prior_month_date(today: date, months_back: int, day: int = 15) -> date:
    month = today.month - months_back
    year = today.year
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, min(day, 28))


@pytest_asyncio.fixture
async def seeded_category(db_session):
    cat = ExpenseCategory(name="Dining", is_system=False, display_order=96)
    db_session.add(cat)
    await db_session.flush()
    return cat


@pytest_asyncio.fixture
async def rich_user(db_session, test_user, seeded_category):
    """A user with income, expenses, a budget, goal, savings, and a loan."""
    today = date.today()
    db_session.add(
        Profile(
            user_id=test_user.id,
            age=30,
            retirement_age=60,
            monthly_income=80000,
            employment_type="salaried",
        )
    )
    db_session.add(
        Income(
            user_id=test_user.id,
            amount=80000,
            source="Salary",
            income_date=today,
            is_recurring=True,
            is_primary=True,
        )
    )
    # Three baseline months at ~20k dining spend.
    for mb in (1, 2, 3):
        db_session.add(
            Expense(
                user_id=test_user.id,
                category_id=seeded_category.id,
                amount=20000,
                expense_date=_prior_month_date(today, mb),
            )
        )
    # A spike this month plus a tight budget → HIGH severity insight.
    db_session.add(
        Expense(
            user_id=test_user.id,
            category_id=seeded_category.id,
            amount=25000,
            expense_date=today,
        )
    )
    db_session.add(
        Budget(
            user_id=test_user.id,
            category_id=seeded_category.id,
            monthly_limit=15000,
            period="monthly",
        )
    )
    db_session.add(
        Goal(
            user_id=test_user.id,
            goal_name="Trip",
            target_amount=200000,
            current_amount=0,
            target_date=date(2027, 1, 1),
            status="Active",
        )
    )
    db_session.add(
        Asset(
            user_id=test_user.id,
            asset_type="Cash",
            name="Emergency fund",
            value=30000,
            is_emergency_fund=True,
            savings_bucket="emergency",
        )
    )
    db_session.add(
        Liability(
            user_id=test_user.id,
            liability_type="Personal Loan",
            name="Personal Loan",
            amount=400000,
            interest_rate=15.0,
            emi=15000,
        )
    )
    await db_session.flush()
    return test_user


class TestScan:
    async def test_scan_produces_evidence_backed_insights(
        self, db_session, rich_user
    ):
        service = MoneyRadarService(db_session)
        summary = await service.scan(rich_user.id)
        assert summary.active_count > 0
        assert summary.coverage
        types = {i.insight_type for i in summary.insights}
        # Seeded data should trigger at least these.
        assert "BUDGET_RISK" in types
        assert "EMERGENCY_FUND_RISK" in types
        assert "DEBT_OPPORTUNITY" in types
        for insight in summary.insights:
            assert insight.evidence, f"{insight.insight_type} has no evidence"
            assert insight.source is not None
            assert insight.detector_version

    async def test_second_scan_deduplicates(self, db_session, rich_user):
        service = MoneyRadarService(db_session)
        first = await service.scan(rich_user.id)
        second = await service.scan(rich_user.id)
        rows = (
            await db_session.execute(
                select(func.count())
                .select_from(RadarInsightRow)
                .where(RadarInsightRow.user_id == rich_user.id)
            )
        ).scalar()
        assert rows == first.active_count
        assert second.active_count == first.active_count

    async def test_empty_user_scans_cleanly(self, db_session, test_user):
        """No fabricated insights on an empty account — coverage shows gaps."""
        service = MoneyRadarService(db_session)
        summary = await service.scan(test_user.id)
        assert summary.active_count == 0
        missing = {c.domain for c in summary.coverage if c.availability == "MISSING"}
        assert "expenses" in missing
        assert "income" in missing

    async def test_scan_never_mutates_financial_data(
        self, db_session, rich_user
    ):
        service = MoneyRadarService(db_session)
        for model in (Expense, Income, Budget, Goal, Asset, Liability):
            before = (
                await db_session.execute(
                    select(func.count())
                    .select_from(model)
                    .where(model.user_id == rich_user.id)
                )
            ).scalar()
            await service.scan(rich_user.id)
            after = (
                await db_session.execute(
                    select(func.count())
                    .select_from(model)
                    .where(model.user_id == rich_user.id)
                )
            ).scalar()
            assert before == after, f"scan mutated {model.__tablename__}"


class TestLifecycle:
    async def test_seen_and_dismiss(self, db_session, rich_user):
        service = MoneyRadarService(db_session)
        summary = await service.scan(rich_user.id)
        target = summary.insights[0]

        seen = await service.mark_seen(rich_user.id, target.id)
        assert seen.status == "SEEN"
        # Idempotent.
        seen2 = await service.mark_seen(rich_user.id, target.id)
        assert seen2.status == "SEEN"

        dismissed = await service.dismiss(rich_user.id, target.id)
        assert dismissed.status == "DISMISSED"
        # Idempotent.
        again = await service.dismiss(rich_user.id, target.id)
        assert again.status == "DISMISSED"

    async def test_dismissed_stays_dismissed_on_rescan(
        self, db_session, rich_user
    ):
        service = MoneyRadarService(db_session)
        summary = await service.scan(rich_user.id)
        target = summary.insights[0]
        await service.dismiss(rich_user.id, target.id)

        rescan = await service.scan(rich_user.id)
        # Dismissed rows no longer appear among active insights.
        assert all(i.id != target.id for i in rescan.insights)
        row = await service.get_insight(rich_user.id, target.id)
        assert row.status == "DISMISSED"

    async def test_condition_disappearing_resolves(self, db_session, rich_user):
        service = MoneyRadarService(db_session)
        summary = await service.scan(rich_user.id)
        budget_insight = next(
            (i for i in summary.insights if i.insight_type == "BUDGET_RISK"),
            None,
        )
        assert budget_insight is not None

        # Fix the condition: raise the limit well above current spend.
        row = (
            await db_session.execute(
                select(Budget).where(Budget.user_id == rich_user.id)
            )
        ).scalar_one()
        row.monthly_limit = Decimal("200000")
        await db_session.flush()

        rescan = await service.scan(rich_user.id)
        assert all(
            not (i.insight_type == "BUDGET_RISK" and i.id == budget_insight.id)
            for i in rescan.insights
        )
        resolved = await service.get_insight(rich_user.id, budget_insight.id)
        assert resolved.status == "RESOLVED"
        assert resolved.resolved_at is not None

    async def test_user_scoping(self, db_session, rich_user):
        service = MoneyRadarService(db_session)
        summary = await service.scan(rich_user.id)
        other = uuid.uuid4()
        with pytest.raises(RadarError) as exc:
            await service.get_insight(other, summary.insights[0].id)
        assert exc.value.code.value == "INSIGHT_NOT_FOUND"
        with pytest.raises(RadarError):
            await service.dismiss(other, summary.insights[0].id)

    async def test_invalid_filter_rejected(self, db_session, rich_user):
        service = MoneyRadarService(db_session)
        with pytest.raises(RadarError) as exc:
            await service.list_insights(
                rich_user.id, statuses=["NOT_A_STATUS"]
            )
        assert exc.value.code.value == "INVALID_FILTER"
