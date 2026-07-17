from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.seed.categories import DEFAULT_EXPENSE_CATEGORIES, seed_expense_categories
from app.seed.cli import _run_seed, main


async def test_seed_expense_categories(db_session):
    inserted = await seed_expense_categories(db_session)
    assert inserted == len(DEFAULT_EXPENSE_CATEGORIES)

    second_insert = await seed_expense_categories(db_session)
    assert second_insert == 0


async def test_cli_run_seed(db_session):
    count = await _run_seed(db_session)
    assert count == len(DEFAULT_EXPENSE_CATEGORIES)


async def test_cli_main(monkeypatch):
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    monkeypatch.setattr("app.seed.cli.engine", test_engine)

    await main()

    async with test_engine.connect() as conn:
        result = await conn.execute(text("SELECT count(*) FROM expense_categories"))
        assert result.scalar() == len(DEFAULT_EXPENSE_CATEGORIES)

    await test_engine.dispose()
