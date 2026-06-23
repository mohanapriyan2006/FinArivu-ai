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
            "sub": "178bb3fe-2254-57b9-8545-1eb1df9bf5a3",
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
            "sub": "141b6b52-3c3b-5556-acf8-d5b27c4f613c",
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
            "sub": "969c020a-603c-5fd8-92de-af7bf0ba4993",
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
