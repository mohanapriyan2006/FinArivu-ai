"""API-level tests for /v1/copilot/actions/* endpoints."""

from __future__ import annotations

import uuid
from decimal import Decimal

import pytest_asyncio

from app.models.categories import ExpenseCategory
from app.schemas.budgets import BudgetCreate
from app.services.budgets import BudgetService


@pytest_asyncio.fixture
async def seeded_category(db_session):
    cat = ExpenseCategory(name="Dining", is_system=False, display_order=98)
    db_session.add(cat)
    await db_session.flush()
    return cat


@pytest_asyncio.fixture
async def seeded_budget(db_session, test_user, seeded_category):
    return await BudgetService(db_session).create_for_user(
        test_user.id,
        BudgetCreate(category_id=seeded_category.id, monthly_limit=Decimal("12000")),
    )


async def test_preview_requires_auth(async_client):
    response = await async_client.post(
        "/api/v1/copilot/actions/preview",
        json={"operation": "UPDATE_BUDGET", "arguments": {}},
    )
    assert response.status_code in (401, 403)


async def test_preview_and_execute_flow(
    async_client, auth_headers, test_user, seeded_budget
):
    preview = await async_client.post(
        "/api/v1/copilot/actions/preview",
        headers=auth_headers,
        json={
            "operation": "UPDATE_BUDGET",
            "arguments": {"categoryName": "Dining", "monthlyLimit": 8000},
        },
    )
    assert preview.status_code == 200
    data = preview.json()["data"]
    assert data["status"] == "AWAITING_CONFIRMATION"
    assert data["before"]["monthlyLimit"] == 12000.0
    assert data["after"]["monthlyLimit"] == 8000.0
    execution_id = data["executionId"]

    execute = await async_client.post(
        "/api/v1/copilot/actions/execute",
        headers=auth_headers,
        json={"executionId": execution_id, "confirmation": True},
    )
    assert execute.status_code == 200
    result = execute.json()["data"]
    assert result["status"] == "EXECUTED"
    assert result["undoAvailable"] is True

    # History shows the executed action.
    history = await async_client.get(
        "/api/v1/copilot/actions/history", headers=auth_headers
    )
    assert history.status_code == 200
    items = history.json()["data"]
    assert any(i["id"] == execution_id for i in items)

    # Undo works.
    undo = await async_client.post(
        f"/api/v1/copilot/actions/{execution_id}/undo",
        headers=auth_headers,
    )
    assert undo.status_code == 200
    assert undo.json()["data"]["status"] == "UNDONE"


async def test_preview_needs_input(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/copilot/actions/preview",
        headers=auth_headers,
        json={"operation": "UPDATE_BUDGET", "arguments": {}},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "NEEDS_INPUT"


async def test_execute_unknown_execution(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/copilot/actions/execute",
        headers=auth_headers,
        json={"executionId": str(uuid.uuid4()), "confirmation": True},
    )
    assert response.status_code == 404


async def test_execute_requires_confirmation_flag(async_client, auth_headers):
    """confirmation: false must be rejected with 422 — note this runs last
    because a validation error rolls back the shared test session."""
    response = await async_client.post(
        "/api/v1/copilot/actions/execute",
        headers=auth_headers,
        json={"executionId": str(uuid.uuid4()), "confirmation": False},
    )
    assert response.status_code == 422


async def test_cancel_flow(async_client, auth_headers, test_user, seeded_budget):
    preview = await async_client.post(
        "/api/v1/copilot/actions/preview",
        headers=auth_headers,
        json={
            "operation": "UPDATE_BUDGET",
            "arguments": {"categoryName": "Dining", "monthlyLimit": 7000},
        },
    )
    execution_id = preview.json()["data"]["executionId"]
    cancel = await async_client.post(
        f"/api/v1/copilot/actions/{execution_id}/cancel",
        headers=auth_headers,
    )
    assert cancel.status_code == 200
    assert cancel.json()["data"]["status"] == "CANCELLED"

    # A cancelled preview cannot execute.
    execute = await async_client.post(
        "/api/v1/copilot/actions/execute",
        headers=auth_headers,
        json={"executionId": execution_id, "confirmation": True},
    )
    assert execute.status_code == 409
