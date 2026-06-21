"""Tests for authentication."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch


class TestAuthMiddleware:
    """Test Clerk JWT authentication middleware."""

    async def test_missing_token_returns_403(self, async_client: AsyncClient):
        """Requests without auth header should be rejected."""
        response = await async_client.post("/api/v1/users/sync", json={"email": "test@example.com"})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @patch("app.auth.middleware.jwt.decode")
    async def test_invalid_token_returns_401(
        self, mock_jwt_decode, async_client: AsyncClient
    ):
        """Invalid JWT token should return 401."""
        mock_jwt_decode.side_effect = Exception("Invalid token")

        response = await async_client.post(
            "/api/v1/users/sync",
            json={"email": "test@example.com"},
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data["success"] is False
        assert data["error_code"] == "AUTH_001"

    @patch("app.auth.middleware.jwt.decode")
    async def test_valid_token_allows_access(
        self, mock_jwt_decode, async_client: AsyncClient
    ):
        """Valid JWT token should allow access to protected endpoints."""
        mock_jwt_decode.return_value = {
            "sub": "user_123",
            "email": "test@example.com",
        }

        response = await async_client.post(
            "/api/v1/users/sync",
            json={"email": "test@example.com"},
            headers={"Authorization": "Bearer valid-token"},
        )
        # Should not be auth-rejected; may be 200 or validation error
        assert response.status_code != status.HTTP_401_UNAUTHORIZED
        assert response.status_code != status.HTTP_403_FORBIDDEN
