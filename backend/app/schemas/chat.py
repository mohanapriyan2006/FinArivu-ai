from __future__ import annotations

from pydantic import Field

from app.schemas.base import BaseSchema


class ChatMessage(BaseSchema):
    """Incoming chat message from a user."""

    session_id: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseSchema):
    """Assistant chat response."""

    message: str
    guardrail_triggered: bool
    disclaimer: str
