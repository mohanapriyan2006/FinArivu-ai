"""Tests for income module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch

from sqlalchemy.ext.asyncio import AsyncSession


class TestIncome:
    """Test income endpoints."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_create_and_list_income(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Create income and verify it appears in the list."""
        mock_jwt_decode.return_value = {
            "sub": "c7b5ac7e-1459-52e0-8a97-aa62555cdda9",
            "email": "income@example.com",
        }

        # Create
        create_resp = await async_client.post(
            "/api/v1/income",
            json={
                "source": "Salary",
                "amount": 50000.00,
                "income_date": "2024-06-01",
                "notes": "Monthly salary",
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        data = create_resp.json()
        assert data["success"] is True
        assert data["data"]["source"] == "Salary"

        # List
        list_resp = await async_client.get(
            "/api/v1/income",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert list_resp.status_code == status.HTTP_200_OK
        items = list_resp.json()
        assert len(items) >= 1
        assert items[0]["source"] == "Salary"

    @patch("app.auth.middleware.jwt.decode")
    async def test_update_income(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Update an existing income entry."""
        mock_jwt_decode.return_value = {
            "sub": "dc01fb44-329a-56fc-873a-f69526b44daf",
            "email": "updateincome@example.com",
        }

        # Create
        create_resp = await async_client.post(
            "/api/v1/income",
            json={"source": "Old", "amount": 1000, "income_date": "2024-06-01"},
            headers={"Authorization": "Bearer valid-token"},
        )
        income_id = create_resp.json()["data"]["id"]

        # Update
        update_resp = await async_client.put(
            f"/api/v1/income/{income_id}",
            json={"source": "Updated", "amount": 2000},
            headers={"Authorization": "Bearer valid-token"},
        )
        assert update_resp.status_code == status.HTTP_200_OK
        assert update_resp.json()["data"]["source"] == "Updated"

    @patch("app.auth.middleware.jwt.decode")
    async def test_delete_income(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Delete an income entry."""
        mock_jwt_decode.return_value = {
            "sub": "c6c5bb54-6ae0-5682-bcf0-e431cc796c57",
            "email": "deleteincome@example.com",
        }

        # Create
        create_resp = await async_client.post(
            "/api/v1/income",
            json={"source": "ToDelete", "amount": 500, "income_date": "2024-06-01"},
            headers={"Authorization": "Bearer valid-token"},
        )
        income_id = create_resp.json()["data"]["id"]

        # Delete
        delete_resp = await async_client.delete(
            f"/api/v1/income/{income_id}",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert delete_resp.status_code == status.HTTP_200_OK

        # Verify list is empty
        list_resp = await async_client.get(
            "/api/v1/income",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert len(list_resp.json()) == 0

    @patch("app.auth.middleware.jwt.decode")
    async def test_validation_error_returns_422(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Missing required fields should return 422 with structured error."""
        mock_jwt_decode.return_value = {
            "sub": "fc9fe1f7-18f1-529e-97ce-1789855f8c38",
            "email": "val@example.com",
        }

        response = await async_client.post(
            "/api/v1/income",
            json={"amount": -100},
            headers={"Authorization": "Bearer valid-token"},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert data["success"] is False
        assert data["error_code"] == "VAL_001"
