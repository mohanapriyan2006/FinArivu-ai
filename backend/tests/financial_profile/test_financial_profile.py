from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.ai.context.builder import ContextBuilder
from app.ai.context.context_requirements import get_required_domains
from app.ai.context.domain import FinancialDomain
from app.schemas.financial_profile import AboutYouUpdate, IncomeProfileUpdate
from app.services.financial_profile import FinancialProfileService


@pytest.mark.asyncio
async def test_update_about_you(async_client: AsyncClient, auth_headers: dict) -> None:
    response = await async_client.put(
        "/api/v1/financial-profile/aboutYou",
        json={"age": 28, "employmentType": "salaried", "city": "Chennai"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["section"] == "aboutYou"


@pytest.mark.asyncio
async def test_update_income_and_completion(
    async_client: AsyncClient, auth_headers: dict
) -> None:
    response = await async_client.put(
        "/api/v1/financial-profile/income",
        json={"amount": 60000, "source": "Salary", "frequency": "monthly"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["monthly_income"] == 60000.0

    completion = await async_client.get(
        "/api/v1/financial-profile/completion",
        headers=auth_headers,
    )
    assert completion.status_code == 200
    data = completion.json()["data"]
    assert "completionPercentage" in data
    assert data["missingSections"] is not None


@pytest.mark.asyncio
async def test_update_savings_and_full_profile(
    async_client: AsyncClient, auth_headers: dict
) -> None:
    await async_client.put(
        "/api/v1/financial-profile/savings",
        json={"emergency_fund": 100000, "general_savings": 50000},
        headers=auth_headers,
    )
    response = await async_client.get(
        "/api/v1/financial-profile",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["savings"]["emergency_fund"] == 100000.0
    assert data["savings"]["total"] == 150000.0


@pytest.mark.asyncio
async def test_context_builder_education_agent_loads_no_profile(
    db_session,
    test_user,
) -> None:
    builder = ContextBuilder(db_session)
    required = get_required_domains(["EducationAgent"])
    context = await builder.build(test_user.id, "session-1", required)
    assert context.income == {}
    assert context.expenses == {}
    assert context.data_available == []


@pytest.mark.asyncio
async def test_context_builder_budget_agent_loads_income_expenses(
    db_session,
    test_user,
) -> None:
    service = FinancialProfileService(db_session)
    await service.update_section(
        test_user.id,
        "aboutYou",
        AboutYouUpdate(
            age=30,
            employment_type="salaried",
            city="Mumbai",
        ),
    )
    await service.update_section(
        test_user.id,
        "income",
        IncomeProfileUpdate(
            amount=Decimal("50000"),
            source="Salary",
            frequency="monthly",
            is_recurring=True,
            is_primary=True,
            income_date=date(2026, 1, 1),
        ),
    )

    builder = ContextBuilder(db_session)
    required = get_required_domains(["BudgetAgent"])
    context = await builder.build(test_user.id, "session-1", required)
    assert context.income.get("monthly_take_home") == 50000.0
    assert FinancialDomain.INCOME.value in context.data_available
