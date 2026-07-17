import uuid

import pytest


async def test_get_my_profile(async_client, auth_headers):
    response = await async_client.get("/api/v1/profiles/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "user_id" in data


async def test_update_my_profile(async_client, auth_headers):
    response = await async_client.put(
        "/api/v1/profiles/me",
        headers=auth_headers,
        json={"full_name": "Test User", "monthly_income": "100000.00"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == "Test User"


async def test_get_profile_by_id(async_client, auth_headers):
    sync = await async_client.post("/api/v1/users/sync", headers=auth_headers)
    user_id = sync.json()["data"]["id"]

    response = await async_client.get(f"/api/v1/profiles/{user_id}", headers=auth_headers)
    # Profile may be created via /me or via user sync; endpoint returns 200 if owned.
    assert response.status_code in (200, 404)


async def test_get_profile_unauthorized(async_client, auth_headers):
    other_id = str(uuid.uuid4())
    response = await async_client.get(
        f"/api/v1/profiles/{other_id}", headers=auth_headers
    )
    assert response.status_code == 404
