"""Add financial health scores table

Revision ID: 003
Revises: 002
Create Date: 2026-06-21 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "financial_health_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("grade", sa.String(length=20), nullable=False),
        sa.Column("savings_score", sa.Integer(), nullable=False),
        sa.Column("emergency_score", sa.Integer(), nullable=False),
        sa.Column("debt_score", sa.Integer(), nullable=False),
        sa.Column("goal_score", sa.Integer(), nullable=False),
        sa.Column("budget_score", sa.Integer(), nullable=False),
        sa.Column("component_scores", postgresql.JSON(), nullable=False, server_default="{}"),
        sa.Column("insights", postgresql.JSON(), nullable=False, server_default="[]"),
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
    op.create_index(
        "ix_financial_health_scores_user_id",
        "financial_health_scores",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_financial_health_scores_created_at",
        "financial_health_scores",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_financial_health_scores_created_at", table_name="financial_health_scores")
    op.drop_index("ix_financial_health_scores_user_id", table_name="financial_health_scores")
    op.drop_table("financial_health_scores")
