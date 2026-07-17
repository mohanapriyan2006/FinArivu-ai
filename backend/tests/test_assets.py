from __future__ import annotations

from datetime import date


async def test_create_and_list_assets(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/assets",
        headers=auth_headers,
        json={
            "asset_type": "Bank",
            "name": "Savings Account",
            "value": "150000.00",
            "currency": "INR",
            "as_of_date": date.today().isoformat(),
            "is_emergency_fund": True,
        },
    )
    assert response.status_code == 201
    asset_id = response.json()["data"]["id"]

    list_response = await async_client.get("/api/v1/assets", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == asset_id for item in list_response.json()["data"]["items"])


async def test_update_and_delete_asset(async_client, auth_headers, test_user):
    create = await async_client.post(
        "/api/v1/assets",
        headers=auth_headers,
        json={
            "asset_type": "Stock",
            "name": "Equity Holdings",
            "value": "50000.00",
        },
    )
    asset_id = create.json()["data"]["id"]

    update = await async_client.put(
        f"/api/v1/assets/{asset_id}",
        headers=auth_headers,
        json={"value": "75000.00"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["value"] == "75000.00"

    delete = await async_client.delete(f"/api/v1/assets/{asset_id}", headers=auth_headers)
    assert delete.status_code == 200
