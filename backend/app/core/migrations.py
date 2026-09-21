from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from app.core.logger import logger
from app.models import Base


async def _ensure_schema(conn: AsyncConnection) -> None:
    """Create any missing tables from SQLAlchemy metadata."""
    await conn.run_sync(Base.metadata.create_all)


async def _table_columns(conn: AsyncConnection, table: str) -> set[str]:
    """Return the column names of a table using dialect-agnostic inspection."""
    return {
        col["name"]
        for col in await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_columns(table)
        )
    }


async def _migrate_users(conn: AsyncConnection) -> None:
    """Idempotently migrate the users table for local auth.

    - Rename clerk_id -> external_id if it still exists.
    - Add password_hash if it is missing.
    """
    columns = await _table_columns(conn, "users")

    if "clerk_id" in columns:
        await conn.execute(
            text("ALTER TABLE users RENAME COLUMN clerk_id TO external_id;")
        )
        logger.info("Migrated users.clerk_id -> users.external_id")

    if "password_hash" not in columns:
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);")
        )
        logger.info("Added users.password_hash column")


async def _migrate_expense_categories(conn: AsyncConnection) -> None:
    """Idempotently add missing ExpenseCategory columns.

    The existing schema may pre-date the full category model, so ensure
    description, icon, color, is_system, and display_order exist.
    """
    columns = await _table_columns(conn, "expense_categories")

    if "description" not in columns:
        await conn.execute(text("ALTER TABLE expense_categories ADD COLUMN description TEXT;"))
        logger.info("Added expense_categories.description")

    if "icon" not in columns:
        await conn.execute(
            text("ALTER TABLE expense_categories ADD COLUMN icon VARCHAR(100);")
        )
        logger.info("Added expense_categories.icon")

    if "color" not in columns:
        await conn.execute(
            text("ALTER TABLE expense_categories ADD COLUMN color VARCHAR(50);")
        )
        logger.info("Added expense_categories.color")

    if "is_system" not in columns:
        await conn.execute(
            text(
                "ALTER TABLE expense_categories "
                "ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;"
            )
        )
        logger.info("Added expense_categories.is_system")

    if "display_order" not in columns:
        await conn.execute(
            text(
                "ALTER TABLE expense_categories "
                "ADD COLUMN display_order INTEGER DEFAULT 0;"
            )
        )
        logger.info("Added expense_categories.display_order")


async def _ensure_columns(
    conn: AsyncConnection,
    table: str,
    columns: dict[str, str],
) -> None:
    """Idempotently add missing columns to a table."""
    existing = await _table_columns(conn, table)

    for name, spec in columns.items():
        if name not in existing:
            await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {spec};"))
            logger.info("Added %s.%s", table, name)


async def _migrate_profiles_avatar(conn: AsyncConnection) -> None:
    """Idempotently add avatar_url column to profiles."""
    await _ensure_columns(
        conn,
        "profiles",
        {"avatar_url": "VARCHAR(512)"},
    )


async def _migrate_import_provenance(conn: AsyncConnection) -> None:
    """Phase 5 — import provenance columns on expenses and income.

    ``income.source`` already stores the income-source enum, so income
    rows carry only batch + fingerprint lineage; expenses gain a
    manual/imported ``source`` marker as well.
    """
    await _ensure_columns(
        conn,
        "expenses",
        {
            "source": "VARCHAR(50) NOT NULL DEFAULT 'manual'",
            "import_batch_id": "UUID",
            "import_fingerprint": "VARCHAR(80)",
        },
    )
    await _ensure_columns(
        conn,
        "income",
        {
            "import_batch_id": "UUID",
            "import_fingerprint": "VARCHAR(80)",
        },
    )


async def _migrate_financial_profile(conn: AsyncConnection) -> None:
    """Idempotently add financial profile columns and ensure new tables exist."""
    await _ensure_columns(
        conn,
        "profiles",
        {
            "employment_type": "VARCHAR(100)",
            "dependents": "INTEGER",
            "children_count": "INTEGER",
            "profile_initialized": "BOOLEAN NOT NULL DEFAULT false",
            "completed_at": "TIMESTAMP WITH TIME ZONE",
        },
    )
    await _ensure_columns(
        conn,
        "income",
        {
            "is_primary": "BOOLEAN NOT NULL DEFAULT false",
            "frequency": "VARCHAR(50)",
        },
    )
    await _ensure_columns(
        conn,
        "assets",
        {
            "savings_bucket": "VARCHAR(50)",
            "interest_rate": "NUMERIC(5, 2)",
            "maturity_date": "DATE",
            "source": "VARCHAR(50) NOT NULL DEFAULT 'manual'",
        },
    )
    await _ensure_columns(
        conn,
        "liabilities",
        {
            "credit_limit": "NUMERIC(15, 2)",
            "monthly_spend": "NUMERIC(15, 2)",
            "source": "VARCHAR(50) NOT NULL DEFAULT 'manual'",
        },
    )


async def apply_migrations(engine: AsyncEngine) -> None:
    """Apply startup migrations inside a single transaction."""
    logger.info("Applying database migrations")
    async with engine.begin() as conn:
        await _ensure_schema(conn)
        await _migrate_users(conn)
        await _migrate_expense_categories(conn)
        await _migrate_financial_profile(conn)
        await _migrate_profiles_avatar(conn)
        await _migrate_import_provenance(conn)
    logger.info("Database migrations complete")
