"""ScenarioService tests — run/save/list/get/rerun/compare/delete on real data."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
import pytest_asyncio

from app.models.assets import Asset
from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.goals import Goal
from app.models.income import Income
from app.models.liabilities import Liability
from app.models.profiles import Profile
from app.scenarios.errors import ScenarioError
from app.scenarios.scenario_types import ScenarioRunStatus
from app.scenarios import schemas as S
from app.scenarios.service import ScenarioService


@pytest_asyncio.fixture
async def seeded_user(db_session, test_user):
    """A user with income, expenses, a goal, savings, and a loan."""
    today = date.today()
    db_session.add(
        Profile(user_id=test_user.id, age=30, retirement_age=60,
                monthly_income=100000, employment_type="salaried")
    )
    db_session.add(
        Income(user_id=test_user.id, amount=100000, source="Salary",
               income_date=today, is_recurring=True, is_primary=True)
    )
    category = ExpenseCategory(name="Dining", is_system=False, display_order=97)
    db_session.add(category)
    await db_session.flush()
    # ~60,000/month of expenses across the last three months.
    for months_back in (1, 2, 3):
        month = today.month - months_back
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        db_session.add(
            Expense(user_id=test_user.id, category_id=category.id,
                    amount=60000, expense_date=date(year, month, 15))
        )
    db_session.add(
        Goal(user_id=test_user.id, goal_name="Laptop",
             target_amount=120000, current_amount=0,
             target_date=date(2027, 6, 1), status="Active")
    )
    db_session.add(
        Asset(user_id=test_user.id, asset_type="Cash", name="Savings",
              value=200000, is_emergency_fund=True, savings_bucket="emergency")
    )
    db_session.add(
        Liability(user_id=test_user.id, liability_type="Home Loan",
                  name="Home Loan", amount=1000000, interest_rate=9.0,
                  emi=12000)
    )
    await db_session.flush()
    return test_user


class TestRun:
    async def test_run_income_change(self, db_session, seeded_user):
        service = ScenarioService(db_session)
        result = await service.run(
            seeded_user.id,
            "INCOME_CHANGE",
            {"changeType": "percent", "changeValue": 10},
        )
        assert result.status == ScenarioRunStatus.COMPUTED
        income = next(m for m in result.metrics if m.key == "monthlyIncome")
        assert income.before == 100000.0
        assert income.after == pytest.approx(110000.0)
        assert result.data_quality.value == "complete"

    async def test_needs_input_for_missing_params(self, db_session, seeded_user):
        service = ScenarioService(db_session)
        result = await service.run(
            seeded_user.id, "PURCHASE", {}
        )
        assert result.status == ScenarioRunStatus.NEEDS_INPUT
        assert "purchase_amount" in result.missing_fields
        assert result.clarification_question

    async def test_invalid_type_raises(self, db_session, seeded_user):
        service = ScenarioService(db_session)
        with pytest.raises(ScenarioError):
            await service.run(seeded_user.id, "FLY_TO_MOON", {})

    async def test_insufficient_data_for_retirement_without_age(
        self, db_session, test_user
    ):
        service = ScenarioService(db_session)
        result = await service.run(
            test_user.id,
            "RETIREMENT_AGE_CHANGE",
            {"newRetirementAge": 55},
        )
        assert result.status == ScenarioRunStatus.INSUFFICIENT_DATA
        assert "age" in result.data_missing or "age" in result.missing_fields

    async def test_run_never_mutates(self, db_session, seeded_user):
        service = ScenarioService(db_session)
        income_before = (await db_session.execute(
            __import__("sqlalchemy").select(Income).where(
                Income.user_id == seeded_user.id
            )
        )).scalar_one().amount
        await service.run(
            seeded_user.id, "INCOME_CHANGE",
            {"changeType": "set", "changeValue": 500000},
        )
        income_after = (await db_session.execute(
            __import__("sqlalchemy").select(Income).where(
                Income.user_id == seeded_user.id
            )
        )).scalar_one().amount
        assert income_before == income_after


class TestSaveAndHistory:
    async def test_save_then_list_get_rerun_delete(
        self, db_session, seeded_user
    ):
        service = ScenarioService(db_session)
        saved = await service.save_scenario(
            seeded_user.id,
            S.ScenarioSaveRequest(
                scenario_type="PURCHASE",
                title="Laptop fund",
                parameters={"purchaseAmount": 150000, "itemName": "Laptop"},
            ),
        )
        assert saved.scenario_id is not None

        items = await service.list_scenarios(seeded_user.id)
        assert len(items) == 1
        assert items[0].title == "Laptop fund"

        fetched = await service.get_scenario(seeded_user.id, saved.scenario_id)
        assert fetched.title == "Laptop fund"
        assert fetched.metrics

        rerun = await service.rerun(seeded_user.id, saved.scenario_id)
        assert rerun.status == ScenarioRunStatus.COMPUTED
        assert rerun.scenario_id == saved.scenario_id

        await service.delete_scenario(seeded_user.id, saved.scenario_id)
        items = await service.list_scenarios(seeded_user.id)
        assert items == []

    async def test_user_scoping(self, db_session, seeded_user):
        """Another user cannot read or delete this user's scenario."""
        import uuid

        service = ScenarioService(db_session)
        saved = await service.save_scenario(
            seeded_user.id,
            S.ScenarioSaveRequest(
                scenario_type="PURCHASE",
                parameters={"purchaseAmount": 10000},
            ),
        )
        other = uuid.uuid4()
        with pytest.raises(ScenarioError):
            await service.get_scenario(other, saved.scenario_id)
        with pytest.raises(ScenarioError):
            await service.delete_scenario(other, saved.scenario_id)


class TestCompare:
    async def test_compare_inline(self, db_session, seeded_user):
        service = ScenarioService(db_session)
        result = await service.compare(
            seeded_user.id,
            S.ScenarioCompareRequest(
                scenarios=[
                    S.ScenarioSaveRequest(
                        scenario_type="INCOME_CHANGE",
                        parameters={"changeType": "percent", "changeValue": 10},
                    ),
                    S.ScenarioSaveRequest(
                        scenario_type="INCOME_CHANGE",
                        parameters={"changeType": "percent", "changeValue": 20},
                    ),
                ]
            ),
        )
        assert len(result.titles) == 2
        income_row = next(r for r in result.rows if r.key == "monthlyIncome")
        assert income_row.cells[0].after == pytest.approx(110000.0)
        assert income_row.cells[1].after == pytest.approx(120000.0)

    async def test_compare_with_saved(self, db_session, seeded_user):
        service = ScenarioService(db_session)
        saved = await service.save_scenario(
            seeded_user.id,
            S.ScenarioSaveRequest(
                scenario_type="EXPENSE_CHANGE",
                parameters={"changeType": "percent", "changeValue": -10},
            ),
        )
        result = await service.compare(
            seeded_user.id,
            S.ScenarioCompareRequest(
                scenarios=[
                    S.ScenarioSaveRequest(
                        scenario_type="EXPENSE_CHANGE",
                        parameters={"changeType": "percent", "changeValue": -20},
                    )
                ],
                scenario_ids=[saved.scenario_id],
            ),
        )
        assert len(result.titles) == 2

    async def test_compare_limit(self, db_session, seeded_user):
        service = ScenarioService(db_session)
        scenarios = [
            S.ScenarioSaveRequest(
                scenario_type="INCOME_CHANGE",
                parameters={"changeType": "percent", "changeValue": i + 1},
            )
            for i in range(5)
        ]
        with pytest.raises(ScenarioError):
            await service.compare(
                seeded_user.id, S.ScenarioCompareRequest(scenarios=scenarios)
            )
