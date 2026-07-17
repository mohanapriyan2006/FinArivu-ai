from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from app.core.logger import logger
from app.models import Base


async def _ensure_schema(conn: AsyncConnection) -> None:
    """Create any missing tables from SQLAlchemy metadata."""
    await conn.run_sync(Base.metadata.create_all)


async def _migrate_users(conn: AsyncConnection) -> None:
    """Idempotently migrate the users table for local auth.

    - Rename clerk_id -> external_id if it still exists.
    - Add password_hash if it is missing.
    """
    result = await conn.execute(
        text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name IN ('clerk_id', 'password_hash')
            """
        )
    )
    columns = {row[0] for row in result.all()}

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
    result = await conn.execute(
        text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'expense_categories'
              AND column_name IN (
                  'description', 'icon', 'color', 'is_system', 'display_order'
              )
            """
        )
    )
    columns = {row[0] for row in result.all()}

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


async def apply_migrations(engine: AsyncEngine) -> None:
    """Apply startup migrations inside a single transaction."""
    logger.info("Applying database migrations")
    async with engine.begin() as conn:
        await _ensure_schema(conn)
        await _migrate_users(conn)
        await _migrate_expense_categories(conn)
    logger.info("Database migrations complete")
