from __future__ import annotations

from datetime import date


async def test_create_and_list_goals(async_client, auth_headers, test_user):
    target_date = date.today().replace(year=date.today().year + 2)
    response = await async_client.post(
        "/api/v1/goals",
        headers=auth_headers,
        json={
            "goal_name": "Buy Car",
            "target_amount": "800000.00",
            "current_amount": "100000.00",
            "target_date": target_date.isoformat(),
            "priority": "High",
            "status": "Active",
        },
    )
    assert response.status_code == 201
    goal_id = response.json()["data"]["id"]

    list_response = await async_client.get("/api/v1/goals", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == goal_id for item in list_response.json()["data"]["items"])


async def test_update_and_delete_goal(async_client, auth_headers, test_user):
    target_date = date.today().replace(year=date.today().year + 3)
    create = await async_client.post(
        "/api/v1/goals",
        headers=auth_headers,
        json={
            "goal_name": "Emergency Fund",
            "target_amount": "300000.00",
            "target_date": target_date.isoformat(),
        },
    )
    goal_id = create.json()["data"]["id"]

    update = await async_client.put(
        f"/api/v1/goals/{goal_id}",
        headers=auth_headers,
        json={"current_amount": "50000.00"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["current_amount"] == "50000.00"

    delete = await async_client.delete(f"/api/v1/goals/{goal_id}", headers=auth_headers)
    assert delete.status_code == 200
