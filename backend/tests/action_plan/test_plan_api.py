"""API-level tests for /v1/action-plan/* endpoints."""

from __future__ import annotations

import uuid
from datetime import date

import pytest_asyncio

from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.income import Income


@pytest_asyncio.fixture
async def plan_seed(db_session, test_user):
    cat = ExpenseCategory(name="Food", is_system=False, display_order=94)
    db_session.add(cat)
    await db_session.flush()
    db_session.add(
        Income(
            user_id=test_user.id, amount=60000, source="Salary",
            income_date=date.today(), is_primary=True,
        )
    )
    db_session.add(
        Expense(
            user_id=test_user.id, category_id=cat.id, amount=5000,
            expense_date=date.today(),
        )
    )
    await db_session.flush()


async def test_current_requires_auth(async_client):
    response = await async_client.get("/api/v1/action-plan/current")
    assert response.status_code in (401, 403)


async def test_current_plan_contract(
    async_client, auth_headers, test_user, plan_seed
):
    response = await async_client.get(
        "/api/v1/action-plan/current", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "id" in data
    assert "periodStart" in data and "periodEnd" in data
    assert data["status"] == "ACTIVE"
    assert isinstance(data["items"], list)
    assert "activeCount" in data and "completedCount" in data
    assert data["planVersion"] == "action_plan_v1"


async def test_generate_and_idempotent(
    async_client, auth_headers, test_user, plan_seed
):
    first = await async_client.post(
        "/api/v1/action-plan/generate", headers=auth_headers
    )
    assert first.status_code == 200
    second = await async_client.post(
        "/api/v1/action-plan/generate", headers=auth_headers
    )
    assert second.status_code == 200
    assert first.json()["data"]["id"] == second.json()["data"]["id"]


async def test_item_lifecycle_endpoints(
    async_client, auth_headers, test_user, plan_seed
):
    plan = (
        await async_client.get(
            "/api/v1/action-plan/current?refresh=true", headers=auth_headers
        )
    ).json()["data"]
    if not plan["items"]:
        return  # no actionable items from this seed — nothing to transition

    item = plan["items"][0]
    detail = await async_client.get(
        f"/api/v1/action-plan/items/{item['id']}", headers=auth_headers
    )
    assert detail.status_code == 200
    assert detail.json()["data"]["evidence"]

    accepted = await async_client.post(
        f"/api/v1/action-plan/items/{item['id']}/accept", headers=auth_headers
    )
    assert accepted.status_code == 200
    assert accepted.json()["data"]["status"] == "IN_PROGRESS"

    done = await async_client.post(
        f"/api/v1/action-plan/items/{item['id']}/complete",
        headers=auth_headers,
        json={},
    )
    assert done.status_code == 200
    assert done.json()["data"]["status"] == "COMPLETED"

    # Terminal state rejects further mutation.
    again = await async_client.post(
        f"/api/v1/action-plan/items/{item['id']}/dismiss", headers=auth_headers
    )
    assert again.status_code in (400, 409)


async def test_snooze_requires_valid_option(
    async_client, auth_headers, test_user, plan_seed
):
    plan = (
        await async_client.get(
            "/api/v1/action-plan/current", headers=auth_headers
        )
    ).json()["data"]
    if not plan["items"]:
        return
    item = plan["items"][0]
    bad = await async_client.post(
        f"/api/v1/action-plan/items/{item['id']}/snooze",
        headers=auth_headers,
        json={"option": "SOMEDAY"},
    )
    assert bad.status_code == 422

    ok = await async_client.post(
        f"/api/v1/action-plan/items/{item['id']}/snooze",
        headers=auth_headers,
        json={"option": "TOMORROW"},
    )
    assert ok.status_code == 200
    assert ok.json()["data"]["status"] == "SNOOZED"
    assert ok.json()["data"]["snoozedUntil"]


async def test_unknown_item_404(async_client, auth_headers, test_user):
    response = await async_client.get(
        f"/api/v1/action-plan/items/{uuid.uuid4()}", headers=auth_headers
    )
    assert response.status_code == 404
    response = await async_client.post(
        f"/api/v1/action-plan/items/{uuid.uuid4()}/complete",
        headers=auth_headers,
        json={},
    )
    assert response.status_code == 404


async def test_history_endpoint(async_client, auth_headers, test_user):
    response = await async_client.get(
        "/api/v1/action-plan/history", headers=auth_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json()["data"], list)


async def test_add_from_insight_validates(
    async_client, auth_headers, test_user
):
    response = await async_client.post(
        "/api/v1/action-plan/items/from-insight",
        headers=auth_headers,
        json={"insightId": str(uuid.uuid4())},
    )
    assert response.status_code == 404
