"""Tests for budget module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch

from sqlalchemy.ext.asyncio import AsyncSession


class TestBudget:
    """Test budget endpoints."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_create_and_list_budget(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Create budget and verify it appears in the list."""
        mock_jwt_decode.return_value = {
            "sub": "b6a56802-c643-5693-af9e-6aa08182f37e",
            "email": "budget@example.com",
        }

        # First seed a category via the categories endpoint or directly
        # The test DB may not have categories seeded; let's create via API
        # Create budget - need a valid category_id
        # We need to fetch categories first
        cats_resp = await async_client.get(
            "/api/v1/categories",
            headers={"Authorization": "Bearer valid-token"},
        )
        cats_data = cats_resp.json().get("data", [])
        if cats_resp.status_code != status.HTTP_200_OK or not cats_data:
            pytest.skip("Categories not available in test DB")

        category_id = cats_data[0]["id"]

        # Create
        create_resp = await async_client.post(
            "/api/v1/budgets",
            json={
                "category_id": category_id,
                "monthly_limit": 5000.00,
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        data = create_resp.json()
        assert data["success"] is True
        assert data["data"]["monthly_limit"] == "5000.00"

        # List
        list_resp = await async_client.get(
            "/api/v1/budgets",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert list_resp.status_code == status.HTTP_200_OK
        items = list_resp.json()
        assert len(items) >= 1
        assert items[0]["monthly_limit"] == "5000.00"

    @patch("app.auth.middleware.jwt.decode")
    async def test_update_budget(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Update an existing budget entry."""
        mock_jwt_decode.return_value = {
            "sub": "cfa519ce-3ca7-5937-96c2-de5963bf2028",
            "email": "updatebudget@example.com",
        }

        cats_resp = await async_client.get(
            "/api/v1/categories",
            headers={"Authorization": "Bearer valid-token"},
        )
        cats_data = cats_resp.json().get("data", [])
        if cats_resp.status_code != status.HTTP_200_OK or not cats_data:
            pytest.skip("Categories not available in test DB")

        category_id = cats_data[0]["id"]

        # Create
        create_resp = await async_client.post(
            "/api/v1/budgets",
            json={"category_id": category_id, "monthly_limit": 3000},
            headers={"Authorization": "Bearer valid-token"},
        )
        budget_id = create_resp.json()["data"]["id"]

        # Update
        update_resp = await async_client.put(
            f"/api/v1/budgets/{budget_id}",
            json={"monthly_limit": 6000},
            headers={"Authorization": "Bearer valid-token"},
        )
        assert update_resp.status_code == status.HTTP_200_OK
        assert update_resp.json()["data"]["monthly_limit"] == "6000.00"

    @patch("app.auth.middleware.jwt.decode")
    async def test_delete_budget(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Delete a budget entry."""
        mock_jwt_decode.return_value = {
            "sub": "f6a3ff87-5cc9-5fb2-9bba-b3be670e5a8c",
            "email": "deletebudget@example.com",
        }

        cats_resp = await async_client.get(
            "/api/v1/categories",
            headers={"Authorization": "Bearer valid-token"},
        )
        cats_data = cats_resp.json().get("data", [])
        if cats_resp.status_code != status.HTTP_200_OK or not cats_data:
            pytest.skip("Categories not available in test DB")

        category_id = cats_data[0]["id"]

        # Create
        create_resp = await async_client.post(
            "/api/v1/budgets",
            json={"category_id": category_id, "monthly_limit": 2000},
            headers={"Authorization": "Bearer valid-token"},
        )
        budget_id = create_resp.json()["data"]["id"]

        # Delete
        delete_resp = await async_client.delete(
            f"/api/v1/budgets/{budget_id}",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert delete_resp.status_code == status.HTTP_200_OK

        # Verify list is empty
        list_resp = await async_client.get(
            "/api/v1/budgets",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert len(list_resp.json()) == 0

    @patch("app.auth.middleware.jwt.decode")
    async def test_validation_error_amount_must_be_positive(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Budget monthly_limit must be greater than 0."""
        mock_jwt_decode.return_value = {
            "sub": "e40d30aa-5c05-51c0-a64c-c7ade2606f67",
            "email": "valbudget@example.com",
        }

        cats_resp = await async_client.get(
            "/api/v1/categories",
            headers={"Authorization": "Bearer valid-token"},
        )
        cats_data = cats_resp.json().get("data", [])
        if cats_resp.status_code != status.HTTP_200_OK or not cats_data:
            pytest.skip("Categories not available in test DB")

        category_id = cats_data[0]["id"]

        response = await async_client.post(
            "/api/v1/budgets",
            json={"category_id": category_id, "monthly_limit": -100},
            headers={"Authorization": "Bearer valid-token"},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert data["success"] is False
        assert data["error_code"] == "VAL_001"

    @patch("app.auth.middleware.jwt.decode")
    async def test_duplicate_category_budget_rejected(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Creating a budget for an already budgeted category should fail."""
        mock_jwt_decode.return_value = {
            "sub": "b7e05cf4-5108-54e5-beac-e512c5def29e",
            "email": "dupbudget@example.com",
        }

        cats_resp = await async_client.get(
            "/api/v1/categories",
            headers={"Authorization": "Bearer valid-token"},
        )
        cats_data = cats_resp.json().get("data", [])
        if cats_resp.status_code != status.HTTP_200_OK or not cats_data:
            pytest.skip("Categories not available in test DB")

        category_id = cats_data[0]["id"]

        # First budget creation should succeed
        first = await async_client.post(
            "/api/v1/budgets",
            json={"category_id": category_id, "monthly_limit": 5000},
            headers={"Authorization": "Bearer valid-token"},
        )
        assert first.status_code == status.HTTP_201_CREATED

        # Second budget for same category should fail with validation error
        second = await async_client.post(
            "/api/v1/budgets",
            json={"category_id": category_id, "monthly_limit": 7000},
            headers={"Authorization": "Bearer valid-token"},
        )
        assert second.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert second.json()["success"] is False

    @patch("app.auth.middleware.jwt.decode")
    async def test_delete_nonexistent_budget_returns_404(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Deleting a budget that does not exist returns 404."""
        mock_jwt_decode.return_value = {
            "sub": "aeb04165-b9d0-5787-b49a-5b1bf606c3d3",
            "email": "404budget@example.com",
        }

        fake_id = "11111111-1111-1111-1111-111111111111"
        resp = await async_client.delete(
            f"/api/v1/budgets/{fake_id}",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
