"""Tests for user module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch

from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User


class TestUserSync:
    """Test user sync endpoint."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_sync_creates_user_and_profile(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Sync should create user and empty profile if they don't exist."""
        mock_jwt_decode.return_value = {
            "sub": "295d093f-76a7-5e72-904d-f5078e36bd5c",
            "email": "newuser@example.com",
        }

        response = await async_client.post(
            "/api/v1/users/sync",
            json={"email": "newuser@example.com"},
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "User synced successfully"
        assert data["data"] is not None

    @patch("app.auth.middleware.jwt.decode")
    async def test_sync_existing_user_returns_profile(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Syncing an existing user should return their profile."""
        mock_jwt_decode.return_value = {
            "sub": "3fb75fa6-2804-5237-b2a1-d325e8576f18",
            "email": "existing@example.com",
        }

        # First sync
        await async_client.post(
            "/api/v1/users/sync",
            json={"email": "existing@example.com"},
            headers={"Authorization": "Bearer valid-token"},
        )

        # Second sync - mock returns new token payload
        mock_jwt_decode.return_value = {
            "sub": "3fb75fa6-2804-5237-b2a1-d325e8576f18",
            "email": "existing@example.com",
        }
        response = await async_client.post(
            "/api/v1/users/sync",
            json={"email": "existing@example.com"},
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
