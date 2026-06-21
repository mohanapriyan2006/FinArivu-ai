"""Tests for Insights module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch

from sqlalchemy.ext.asyncio import AsyncSession


class TestInsights:
    """Test insight endpoints."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_list_insights(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """List insights for a user."""
        mock_jwt_decode.return_value = {
            "sub": "insight_user_123",
            "email": "insight@example.com",
        }

        resp = await async_client.get(
            "/api/v1/insights",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert isinstance(data, list)

    @patch("app.auth.middleware.jwt.decode")
    async def test_get_unread_insights(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Get unread insights."""
        mock_jwt_decode.return_value = {
            "sub": "insight_user_456",
            "email": "insightunread@example.com",
        }

        resp = await async_client.get(
            "/api/v1/insights/unread",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    @patch("app.auth.middleware.jwt.decode")
    async def test_mark_all_read(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Mark all insights as read."""
        mock_jwt_decode.return_value = {
            "sub": "insight_user_789",
            "email": "insightread@example.com",
        }

        resp = await async_client.post(
            "/api/v1/insights/mark-all-read",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["success"] is True
        assert "marked_read" in data["data"]
