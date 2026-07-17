from __future__ import annotations


async def test_create_and_list_liabilities(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/liabilities",
        headers=auth_headers,
        json={
            "liability_type": "Home Loan",
            "name": "Home Loan",
            "amount": "2500000.00",
            "interest_rate": "8.50",
            "emi": "25000.00",
            "remaining_tenure_months": 120,
        },
    )
    assert response.status_code == 201
    liability_id = response.json()["data"]["id"]

    list_response = await async_client.get("/api/v1/liabilities", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == liability_id for item in list_response.json()["data"]["items"])


async def test_update_and_delete_liability(async_client, auth_headers, test_user):
    create = await async_client.post(
        "/api/v1/liabilities",
        headers=auth_headers,
        json={
            "liability_type": "Credit Card",
            "name": "Credit Card Bill",
            "amount": "50000.00",
        },
    )
    liability_id = create.json()["data"]["id"]

    update = await async_client.put(
        f"/api/v1/liabilities/{liability_id}",
        headers=auth_headers,
        json={"amount": "45000.00"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["amount"] == "45000.00"

    delete = await async_client.delete(f"/api/v1/liabilities/{liability_id}", headers=auth_headers)
    assert delete.status_code == 200
