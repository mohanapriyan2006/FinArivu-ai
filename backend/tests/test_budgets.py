from __future__ import annotations


async def _create_category(async_client, auth_headers, name: str) -> str:
    response = await async_client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": name, "display_order": 99},
    )
    return response.json()["data"]["id"]


async def test_create_and_list_budgets(async_client, auth_headers, test_user):
    category_id = await _create_category(async_client, auth_headers, "BudgetCategory")
    response = await async_client.post(
        "/api/v1/budgets",
        headers=auth_headers,
        json={"category_id": category_id, "monthly_limit": "10000.00", "period": "monthly"},
    )
    assert response.status_code == 201
    budget_id = response.json()["data"]["id"]

    list_response = await async_client.get("/api/v1/budgets", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == budget_id for item in list_response.json()["data"]["items"])


async def test_duplicate_budget_fails(async_client, auth_headers, test_user):
    category_id = await _create_category(async_client, auth_headers, "DupBudgetCategory")
    await async_client.post(
        "/api/v1/budgets",
        headers=auth_headers,
        json={"category_id": category_id, "monthly_limit": "5000.00"},
    )
    response = await async_client.post(
        "/api/v1/budgets",
        headers=auth_headers,
        json={"category_id": category_id, "monthly_limit": "7000.00"},
    )
    assert response.status_code == 409


async def test_update_and_delete_budget(async_client, auth_headers, test_user):
    category_id = await _create_category(async_client, auth_headers, "UpdateBudgetCategory")
    create = await async_client.post(
        "/api/v1/budgets",
        headers=auth_headers,
        json={"category_id": category_id, "monthly_limit": "8000.00"},
    )
    budget_id = create.json()["data"]["id"]

    update = await async_client.put(
        f"/api/v1/budgets/{budget_id}",
        headers=auth_headers,
        json={"monthly_limit": "12000.00"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["monthly_limit"] == "12000.00"

    delete = await async_client.delete(f"/api/v1/budgets/{budget_id}", headers=auth_headers)
    assert delete.status_code == 200
