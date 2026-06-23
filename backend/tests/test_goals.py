"""Tests for goals module."""

import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import patch
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession


class TestGoals:
    """Test goal endpoints."""

    @patch("app.auth.middleware.jwt.decode")
    async def test_create_and_list_goal(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Create goal and verify it appears in the list."""
        mock_jwt_decode.return_value = {
            "sub": "d94cb3c9-fe29-5dc9-9c69-08336ae0cdd1",
            "email": "goal@example.com",
        }

        target = (date.today() + timedelta(days=365)).isoformat()

        create_resp = await async_client.post(
            "/api/v1/goals",
            json={
                "goal_name": "Buy a House",
                "goal_type": "House",
                "target_amount": 1000000,
                "current_amount": 250000,
                "target_date": target,
                "status": "Active",
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        data = create_resp.json()
        assert data["success"] is True
        assert data["data"]["goal_name"] == "Buy a House"

        list_resp = await async_client.get(
            "/api/v1/goals",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert list_resp.status_code == status.HTTP_200_OK
        items = list_resp.json()
        assert len(items) >= 1
        assert items[0]["goal_name"] == "Buy a House"

    @patch("app.auth.middleware.jwt.decode")
    async def test_update_goal(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Update an existing goal."""
        mock_jwt_decode.return_value = {
            "sub": "44d658b1-3566-5cf1-bea6-cf60a849dbed",
            "email": "updategoal@example.com",
        }

        target = (date.today() + timedelta(days=365)).isoformat()
        create_resp = await async_client.post(
            "/api/v1/goals",
            json={
                "goal_name": "Old Goal",
                "goal_type": "Car",
                "target_amount": 500000,
                "current_amount": 0,
                "target_date": target,
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        goal_id = create_resp.json()["data"]["id"]

        update_resp = await async_client.put(
            f"/api/v1/goals/{goal_id}",
            json={"goal_name": "Updated Goal", "current_amount": 50000},
            headers={"Authorization": "Bearer valid-token"},
        )
        assert update_resp.status_code == status.HTTP_200_OK
        assert update_resp.json()["data"]["goal_name"] == "Updated Goal"

    @patch("app.auth.middleware.jwt.decode")
    async def test_delete_goal(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Delete a goal."""
        mock_jwt_decode.return_value = {
            "sub": "7d00e13c-3c60-548c-ae87-2ed4dbf3cdd9",
            "email": "deletegoal@example.com",
        }

        target = (date.today() + timedelta(days=365)).isoformat()
        create_resp = await async_client.post(
            "/api/v1/goals",
            json={
                "goal_name": "ToDelete",
                "goal_type": "Vacation",
                "target_amount": 100000,
                "current_amount": 0,
                "target_date": target,
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        goal_id = create_resp.json()["data"]["id"]

        delete_resp = await async_client.delete(
            f"/api/v1/goals/{goal_id}",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert delete_resp.status_code == status.HTTP_200_OK

        list_resp = await async_client.get(
            "/api/v1/goals",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert len(list_resp.json()) == 0

    @patch("app.auth.middleware.jwt.decode")
    async def test_goal_summary(
        self, mock_jwt_decode, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Get goal summary."""
        mock_jwt_decode.return_value = {
            "sub": "8f5197cc-d100-54ac-9612-212b73007b65",
            "email": "sumgoal@example.com",
        }

        target = (date.today() + timedelta(days=365)).isoformat()
        await async_client.post(
            "/api/v1/goals",
            json={
                "goal_name": "House",
                "goal_type": "House",
                "target_amount": 1000000,
                "current_amount": 500000,
                "target_date": target,
            },
            headers={"Authorization": "Bearer valid-token"},
        )

        resp = await async_client.get(
            "/api/v1/goals/summary",
            headers={"Authorization": "Bearer valid-token"},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["total_goals"] >= 1
