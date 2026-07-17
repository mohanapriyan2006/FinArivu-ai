from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Set required environment variables before any application modules are imported.
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-jwt-signing")
os.environ.setdefault("AES_KEY", "test-aes-key-32bytes-long!!!")
os.environ.setdefault("AES_KEY_SALT", "test-salt-16bytes")
os.environ.setdefault("LOG_LEVEL", "WARNING")
os.environ.setdefault("CORS_ORIGINS", "*")
os.environ.setdefault("RATE_LIMIT_RPM", "1000")

from app.core.database import engine as _engine, get_db_session  # noqa: E402
from app.models.base import Base  # noqa: E402
from main import create_application  # noqa: E402

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Any:
    """Provide a session-scoped event loop."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine() -> Any:
    """Create an in-memory SQLite engine and initialize the schema."""
    eng = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine: Any) -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session rolled back after each test."""
    async with engine.connect() as conn:
        await conn.begin()
        TestingSessionLocal = async_sessionmaker(
            conn,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
            join_transaction_mode="create_savepoint",
        )
        session = TestingSessionLocal()
        yield session
        await session.rollback()
        await session.close()
        await conn.rollback()


@pytest.fixture
def app(db_session: AsyncSession) -> Any:
    """Create a FastAPI app with the test database session."""
    application = create_application()

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    application.dependency_overrides[get_db_session] = override_get_db
    return application


@pytest.fixture
def client(app: Any) -> TestClient:
    """Synchronous test client."""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client(app: Any) -> AsyncGenerator[AsyncClient, None]:
    """Asynchronous test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
