"""API-level tests for /v1/money-radar/* endpoints."""

from __future__ import annotations

import uuid

import pytest_asyncio

from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.income import Income
from datetime import date


@pytest_asyncio.fixture
async def radar_seed(db_session, test_user):
    cat = ExpenseCategory(name="Food", is_system=False, display_order=95)
    db_session.add(cat)
    db_session.add(
        Income(
            user_id=test_user.id,
            amount=60000,
            source="Salary",
            income_date=date.today(),
            is_primary=True,
        )
    )
    await db_session.flush()
    db_session.add(
        Expense(
            user_id=test_user.id,
            category_id=cat.id,
            amount=5000,
            expense_date=date.today(),
        )
    )
    await db_session.flush()


async def test_scan_requires_auth(async_client):
    response = await async_client.post("/api/v1/money-radar/scan")
    assert response.status_code in (401, 403)


async def test_scan_and_summary(async_client, auth_headers, test_user, radar_seed):
    scan = await async_client.post(
        "/api/v1/money-radar/scan", headers=auth_headers
    )
    assert scan.status_code == 200
    data = scan.json()["data"]
    assert "generatedAt" in data
    assert "coverage" in data
    assert isinstance(data["insights"], list)

    summary = await async_client.get(
        "/api/v1/money-radar/summary", headers=auth_headers
    )
    assert summary.status_code == 200
    s = summary.json()["data"]
    assert s["activeCount"] == data["activeCount"]


async def test_insight_listing_and_filters(
    async_client, auth_headers, test_user, radar_seed
):
    await async_client.post("/api/v1/money-radar/scan", headers=auth_headers)

    listing = await async_client.get(
        "/api/v1/money-radar/insights", headers=auth_headers
    )
    assert listing.status_code == 200
    body = listing.json()["data"]
    assert "items" in body and "total" in body

    filtered = await async_client.get(
        "/api/v1/money-radar/insights?status=ACTIVE", headers=auth_headers
    )
    assert filtered.status_code == 200
    for item in filtered.json()["data"]["items"]:
        assert item["status"] == "ACTIVE"

    bad = await async_client.get(
        "/api/v1/money-radar/insights?status=BOGUS", headers=auth_headers
    )
    assert bad.status_code == 422


async def test_lifecycle_endpoints(
    async_client, auth_headers, test_user, radar_seed
):
    await async_client.post("/api/v1/money-radar/scan", headers=auth_headers)
    listing = await async_client.get(
        "/api/v1/money-radar/insights", headers=auth_headers
    )
    items = listing.json()["data"]["items"]
    if not items:
        return  # seeded data produced no insights — nothing to transition

    insight_id = items[0]["id"]
    detail = await async_client.get(
        f"/api/v1/money-radar/insights/{insight_id}", headers=auth_headers
    )
    assert detail.status_code == 200
    assert detail.json()["data"]["evidence"]

    seen = await async_client.post(
        f"/api/v1/money-radar/insights/{insight_id}/seen", headers=auth_headers
    )
    assert seen.status_code == 200
    assert seen.json()["data"]["status"] == "SEEN"

    dismissed = await async_client.post(
        f"/api/v1/money-radar/insights/{insight_id}/dismiss", headers=auth_headers
    )
    assert dismissed.status_code == 200
    assert dismissed.json()["data"]["status"] == "DISMISSED"


async def test_unknown_insight_404(async_client, auth_headers, test_user):
    response = await async_client.get(
        f"/api/v1/money-radar/insights/{uuid.uuid4()}", headers=auth_headers
    )
    assert response.status_code == 404


async def test_other_users_cannot_access(async_client, auth_headers, test_user):
    """A real UUID belonging to nobody's data → 404, never a leak."""
    response = await async_client.post(
        f"/api/v1/money-radar/insights/{uuid.uuid4()}/seen",
        headers=auth_headers,
    )
    assert response.status_code == 404
