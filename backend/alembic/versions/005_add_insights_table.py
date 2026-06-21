"""Add insights table

Revision ID: 005
Revises: 004
Create Date: 2026-06-21 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "insights",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_insights_user_id", "insights", ["user_id"], unique=False)
    op.create_index("ix_insights_priority", "insights", ["priority"], unique=False)
    op.create_index("ix_insights_is_read", "insights", ["is_read"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_insights_is_read", table_name="insights")
    op.drop_index("ix_insights_priority", table_name="insights")
    op.drop_index("ix_insights_user_id", table_name="insights")
    op.drop_table("insights")
