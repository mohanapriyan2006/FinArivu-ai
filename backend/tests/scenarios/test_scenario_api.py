"""API-level tests for /v1/scenarios/* endpoints."""

from __future__ import annotations

import pytest
import pytest_asyncio

from app.models.assets import Asset
from app.models.expense_estimates import MonthlyExpenseEstimate
from app.models.goals import Goal
from app.models.income import Income
from app.models.profiles import Profile
from datetime import date


@pytest_asyncio.fixture
async def seeded_user(db_session, test_user):
    db_session.add(Profile(user_id=test_user.id, age=30, retirement_age=60))
    db_session.add(
        Income(user_id=test_user.id, amount=100000, source="Salary",
               income_date=date.today(), is_recurring=True, is_primary=True)
    )
    db_session.add(
        MonthlyExpenseEstimate(user_id=test_user.id, amount=60000,
                               estimate_month=date.today())
    )
    db_session.add(
        Asset(user_id=test_user.id, asset_type="Cash", name="Savings",
              value=200000, is_emergency_fund=True)
    )
    await db_session.flush()
    return test_user


async def test_run_requires_auth(async_client):
    response = await async_client.post(
        "/api/v1/scenarios/run",
        json={"scenarioType": "PURCHASE", "parameters": {"purchaseAmount": 1000}},
    )
    assert response.status_code in (401, 403)


async def test_run_scenario(async_client, auth_headers, seeded_user):
    response = await async_client.post(
        "/api/v1/scenarios/run",
        headers=auth_headers,
        json={
            "scenarioType": "PURCHASE",
            "parameters": {"purchaseAmount": 150000, "itemName": "Laptop"},
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "COMPUTED"
    assert data["scenarioType"] == "PURCHASE"
    assert any(m["key"] == "postPurchaseBuffer" for m in data["metrics"])
    # Apply bridge points at the Phase 1 action preview flow.
    assert data["applyAction"]["operation"] == "CREATE_GOAL"


async def test_needs_input_response(async_client, auth_headers, seeded_user):
    response = await async_client.post(
        "/api/v1/scenarios/run",
        headers=auth_headers,
        json={"scenarioType": "PURCHASE", "parameters": {}},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "NEEDS_INPUT"
    assert "purchase_amount" in data["missingFields"]
    assert data["clarificationQuestion"]


async def test_invalid_type_422(async_client, auth_headers, seeded_user):
    response = await async_client.post(
        "/api/v1/scenarios/run",
        headers=auth_headers,
        json={"scenarioType": "HACK", "parameters": {}},
    )
    assert response.status_code in (400, 422)


async def test_save_list_get_rerun_delete(
    async_client, auth_headers, seeded_user
):
    save = await async_client.post(
        "/api/v1/scenarios/save",
        headers=auth_headers,
        json={
            "scenarioType": "INCOME_CHANGE",
            "title": "Raise",
            "parameters": {"changeType": "percent", "changeValue": 15},
        },
    )
    assert save.status_code == 201
    scenario_id = save.json()["data"]["scenarioId"]
    assert scenario_id

    listed = await async_client.get("/api/v1/scenarios", headers=auth_headers)
    assert listed.status_code == 200
    items = listed.json()["data"]
    assert any(i["id"] == scenario_id for i in items)

    got = await async_client.get(
        f"/api/v1/scenarios/{scenario_id}", headers=auth_headers
    )
    assert got.status_code == 200
    assert got.json()["data"]["title"] == "Raise"

    rerun = await async_client.post(
        f"/api/v1/scenarios/{scenario_id}/rerun", headers=auth_headers
    )
    assert rerun.status_code == 200
    assert rerun.json()["data"]["status"] == "COMPUTED"

    deleted = await async_client.delete(
        f"/api/v1/scenarios/{scenario_id}", headers=auth_headers
    )
    assert deleted.status_code == 200

    missing = await async_client.get(
        f"/api/v1/scenarios/{scenario_id}", headers=auth_headers
    )
    assert missing.status_code == 404


async def test_types_endpoint(async_client, auth_headers):
    response = await async_client.get("/api/v1/scenarios/types", headers=auth_headers)
    assert response.status_code == 200
    types = response.json()["data"]
    assert len(types) == 14
    assert {t["type"] for t in types} >= {"PURCHASE", "INCOME_CHANGE"}
