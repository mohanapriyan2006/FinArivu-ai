from __future__ import annotations

from datetime import date
from decimal import Decimal


async def _create_category(async_client, auth_headers, name: str) -> str:
    response = await async_client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": name, "display_order": 99},
    )
    return response.json()["data"]["id"]


async def test_net_worth(async_client, auth_headers, test_user):
    await async_client.post(
        "/api/v1/assets",
        headers=auth_headers,
        json={"asset_type": "Bank", "name": "Savings", "value": "100000.00"},
    )
    await async_client.post(
        "/api/v1/liabilities",
        headers=auth_headers,
        json={"liability_type": "Credit Card", "name": "CC", "amount": "20000.00"},
    )
    response = await async_client.get("/api/v1/financial/net-worth", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["net_worth"] == "80000.00"


async def test_health_score(async_client, auth_headers, test_user):
    response = await async_client.get("/api/v1/financial/health-score", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "overall_score" in data
    assert "recommendations" in data


async def test_budget_analysis(async_client, auth_headers, test_user):
    category_id = await _create_category(async_client, auth_headers, "Food")
    await async_client.post(
        "/api/v1/budgets",
        headers=auth_headers,
        json={"category_id": category_id, "monthly_limit": "10000.00"},
    )
    await async_client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "category_id": category_id,
            "amount": "5000.00",
            "expense_date": date.today().isoformat(),
        },
    )
    response = await async_client.get("/api/v1/financial/budget-analysis", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "total_spent" in data
    assert "recommendations" in data


async def test_tax_calculation(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/financial/tax",
        headers=auth_headers,
        json={
            "gross_income": "1200000.00",
            "regime": "new",
            "deductions": {"standard_deduction": "50000"},
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["taxable_income"] == "1150000.00"


async def test_retirement_projection(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/financial/retirement",
        headers=auth_headers,
        json={
            "current_age": 30,
            "retirement_age": 60,
            "monthly_expenses": "50000.00",
            "inflation_rate": "0.06",
            "safe_withdrawal_rate": "0.04",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["years_to_retirement"] == 30
    assert Decimal(data["retirement_corpus"]) > 0
