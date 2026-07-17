from __future__ import annotations

from datetime import date


async def _create_category(async_client, auth_headers, name: str) -> str:
    response = await async_client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": name, "display_order": 99},
    )
    return response.json()["data"]["id"]


async def test_create_and_list_expenses(async_client, auth_headers, test_user):
    category_id = await _create_category(async_client, auth_headers, "FoodTest")
    response = await async_client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "category_id": category_id,
            "amount": "2000.00",
            "description": "groceries",
            "expense_date": date.today().isoformat(),
            "payment_method": "UPI",
        },
    )
    assert response.status_code == 201
    expense_id = response.json()["data"]["id"]

    list_response = await async_client.get("/api/v1/expenses", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == expense_id for item in list_response.json()["data"]["items"])


async def test_update_and_delete_expense(async_client, auth_headers, test_user):
    category_id = await _create_category(async_client, auth_headers, "TravelTest")
    create = await async_client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "category_id": category_id,
            "amount": "500.00",
            "description": "cab",
            "expense_date": date.today().isoformat(),
        },
    )
    expense_id = create.json()["data"]["id"]

    update = await async_client.put(
        f"/api/v1/expenses/{expense_id}",
        headers=auth_headers,
        json={"amount": "750.00"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["amount"] == "750.00"

    delete = await async_client.delete(f"/api/v1/expenses/{expense_id}", headers=auth_headers)
    assert delete.status_code == 200
