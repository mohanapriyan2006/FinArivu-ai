from __future__ import annotations


async def test_list_categories(async_client, auth_headers):
    response = await async_client.get("/api/v1/categories", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"]["items"], list)


async def test_create_and_get_category(async_client, auth_headers):
    response = await async_client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": "TestCategory", "description": "test", "display_order": 99},
    )
    assert response.status_code == 201
    category_id = response.json()["data"]["id"]

    get_response = await async_client.get(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["data"]["name"] == "TestCategory"


async def test_update_category(async_client, auth_headers):
    create = await async_client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": "UpdateMe", "display_order": 99},
    )
    category_id = create.json()["data"]["id"]

    response = await async_client.put(
        f"/api/v1/categories/{category_id}",
        headers=auth_headers,
        json={"name": "UpdatedName"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "UpdatedName"


async def test_delete_category(async_client, auth_headers):
    create = await async_client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": "DeleteMe", "display_order": 99},
    )
    category_id = create.json()["data"]["id"]
    response = await async_client.delete(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert response.status_code == 200

    get_response = await async_client.get(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert get_response.status_code == 404
