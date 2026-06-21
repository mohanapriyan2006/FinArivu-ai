"""Tests for profile module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch

from sqlalchemy.ext.asyncio import AsyncSession


class TestProfile:
    """Test profile endpoints."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_create_profile(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Create profile should return saved profile."""
        mock_jwt_decode.return_value = {
            "sub": "profile_user_123",
            "email": "profile@example.com",
        }

        response = await async_client.post(
            "/api/v1/profile",
            json={
                "full_name": "John Doe",
                "age": 30,
                "city": "Mumbai",
                "occupation": "Software Engineer",
                "monthly_income": 75000.00,
                "retirement_age": 60,
            },
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert data["data"]["full_name"] == "John Doe"
        assert data["data"]["age"] == 30

    @patch("app.auth.middleware.jwt.decode")
    async def test_get_profile(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Get profile should return the user's profile."""
        mock_jwt_decode.return_value = {
            "sub": "profile_user_456",
            "email": "getprofile@example.com",
        }

        # Create profile first
        await async_client.post(
            "/api/v1/profile",
            json={"full_name": "Jane Doe", "age": 28},
            headers={"Authorization": "Bearer valid-token"},
        )

        # Get profile
        response = await async_client.get(
            "/api/v1/profile",
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["full_name"] == "Jane Doe"

    @patch("app.auth.middleware.jwt.decode")
    async def test_update_profile(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Update profile should modify existing profile."""
        mock_jwt_decode.return_value = {
            "sub": "profile_user_789",
            "email": "updateprofile@example.com",
        }

        # Create
        await async_client.post(
            "/api/v1/profile",
            json={"full_name": "Old Name", "age": 25},
            headers={"Authorization": "Bearer valid-token"},
        )

        # Update
        response = await async_client.put(
            "/api/v1/profile",
            json={"full_name": "New Name", "age": 26},
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["full_name"] == "New Name"
        assert data["data"]["age"] == 26
