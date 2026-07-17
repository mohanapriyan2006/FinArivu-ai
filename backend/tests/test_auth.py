from __future__ import annotations

import uuid

import jwt
import pytest

from app.core.config import settings


async def test_sync_user(async_client, auth_headers):
    response = await async_client.post("/api/v1/users/sync", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "test@example.com"


async def test_get_me(async_client, auth_headers):
    await async_client.post("/api/v1/users/sync", headers=auth_headers)
    response = await async_client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "test@example.com"


async def test_get_me_missing_auth(async_client):
    response = await async_client.get("/api/v1/users/me")
    assert response.status_code == 401


async def test_get_user_by_id(async_client, auth_headers):
    sync = await async_client.post("/api/v1/users/sync", headers=auth_headers)
    user_id = sync.json()["data"]["id"]
    response = await async_client.get(f"/api/v1/users/{user_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["data"]["id"] == user_id


async def test_update_user(async_client, auth_headers):
    sync = await async_client.post("/api/v1/users/sync", headers=auth_headers)
    user_id = sync.json()["data"]["id"]
    response = await async_client.put(
        f"/api/v1/users/{user_id}",
        headers=auth_headers,
        json={"email": "updated@example.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "updated@example.com"


async def test_get_user_with_wrong_user_id(async_client, auth_headers):
    other_id = str(uuid.uuid4())
    response = await async_client.get(f"/api/v1/users/{other_id}", headers=auth_headers)
    assert response.status_code == 403


async def test_invalid_token(async_client):
    headers = {"Authorization": "Bearer invalid-token"}
    response = await async_client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401
