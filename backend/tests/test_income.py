from __future__ import annotations

from datetime import date


async def test_create_and_list_income(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/income",
        headers=auth_headers,
        json={
            "amount": "50000.00",
            "source": "Salary",
            "income_date": date.today().isoformat(),
            "description": "monthly salary",
            "is_recurring": True,
        },
    )
    assert response.status_code == 201
    income_id = response.json()["data"]["id"]

    list_response = await async_client.get("/api/v1/income", headers=auth_headers)
    assert list_response.status_code == 200
    data = list_response.json()["data"]
    assert any(item["id"] == income_id for item in data["items"])


async def test_get_income(async_client, auth_headers, test_user):
    create = await async_client.post(
        "/api/v1/income",
        headers=auth_headers,
        json={
            "amount": "25000.00",
            "source": "Freelance",
            "income_date": date.today().isoformat(),
        },
    )
    income_id = create.json()["data"]["id"]

    response = await async_client.get(f"/api/v1/income/{income_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["data"]["source"] == "Freelance"


async def test_update_and_delete_income(async_client, auth_headers, test_user):
    create = await async_client.post(
        "/api/v1/income",
        headers=auth_headers,
        json={
            "amount": "10000.00",
            "source": "Bonus",
            "income_date": date.today().isoformat(),
        },
    )
    income_id = create.json()["data"]["id"]

    update = await async_client.put(
        f"/api/v1/income/{income_id}",
        headers=auth_headers,
        json={"amount": "15000.00"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["amount"] == "15000.00"

    delete = await async_client.delete(f"/api/v1/income/{income_id}", headers=auth_headers)
    assert delete.status_code == 200
