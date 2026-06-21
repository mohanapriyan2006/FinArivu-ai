"""Tests for Financial Health module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch

from sqlalchemy.ext.asyncio import AsyncSession


class TestFinancialHealth:
    """Test financial health endpoints."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_get_financial_health(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Get current financial health score."""
        mock_jwt_decode.return_value = {
            "sub": "fh_user_123",
            "email": "fh@example.com",
        }

        resp = await async_client.get(
            "/api/v1/financial-health",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["success"] is True
        assert "score" in data["data"]
        assert "grade" in data["data"]

    @patch("app.auth.middleware.jwt.decode")
    async def test_get_financial_health_history(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Get financial health history."""
        mock_jwt_decode.return_value = {
            "sub": "fh_user_456",
            "email": "fhhist@example.com",
        }

        resp = await async_client.get(
            "/api/v1/financial-health/history",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    @patch("app.auth.middleware.jwt.decode")
    async def test_recalculate_financial_health(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Recalculate and save financial health score."""
        mock_jwt_decode.return_value = {
            "sub": "fh_user_789",
            "email": "fhrecalc@example.com",
        }

        resp = await async_client.post(
            "/api/v1/financial-health/recalculate",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()
        assert data["success"] is True
        assert "score" in data["data"]
        assert "grade" in data["data"]

        # Verify it appears in history
        hist_resp = await async_client.get(
            "/api/v1/financial-health/history",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert hist_resp.status_code == status.HTTP_200_OK
        hist_data = hist_resp.json()
        assert len(hist_data["data"]) >= 1
