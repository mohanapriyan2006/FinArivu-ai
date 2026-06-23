"""Tests for dashboard module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch

from sqlalchemy.ext.asyncio import AsyncSession


class TestDashboard:
    """Test dashboard summary endpoint."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_dashboard_summary(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Dashboard should return summary with income and expenses."""
        mock_jwt_decode.return_value = {
            "sub": "133614da-f5b3-5a45-acf9-d4e2e8cfcff6",
            "email": "dash@example.com",
        }

        # Add income
        await async_client.post(
            "/api/v1/income",
            json={"source": "Salary", "amount": 60000, "income_date": "2024-06-01"},
            headers={"Authorization": "Bearer valid-token"},
        )

        # Get dashboard
        response = await async_client.get(
            "/api/v1/dashboard",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total_income"] == 60000.0
        assert data["data"]["total_expenses"] == 0.0
        assert data["data"]["net_cash_flow"] == 60000.0
        assert len(data["data"]["recent_income"]) == 1
