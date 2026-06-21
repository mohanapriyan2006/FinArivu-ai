"""Pytest configuration and shared fixtures."""

import asyncio
import sys
from pathlib import Path
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path (resolve from this file's location)
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from main import app
from core.database import Base, get_db

# Use file-based SQLite for tests
import tempfile
import os

TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "finarivu_test.db")
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"


test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Override the DB dependency for tests."""
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session")
async def setup_database():
    """Create and drop test database tables."""
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default expense categories for tests
    import uuid
    from models.expense_category import ExpenseCategory

    async with TestSessionLocal() as session:
        category_names = [
            "Food", "Rent", "Travel", "Utilities", "Healthcare",
            "Shopping", "Insurance", "Entertainment", "Education", "Other",
        ]
        for name in category_names:
            session.add(ExpenseCategory(id=uuid.uuid4(), name=name))
        await session.commit()

    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest_asyncio.fixture
async def db_session(setup_database) -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session for each test."""
    async with TestSessionLocal() as session:
        yield session
        # Rollback after each test to keep DB clean
        await session.rollback()


@pytest_asyncio.fixture
async def async_client(setup_database) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
