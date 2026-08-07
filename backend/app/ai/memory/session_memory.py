from __future__ import annotations

import time
from collections import defaultdict
from typing import Any


class SessionMemory:
    """Lightweight in-memory session state for the AI Copilot.

    Stores current topic, goal, recent follow-up questions, and last activity.
    Auto-expires sessions after 30 minutes of inactivity.
    """

    INACTIVITY_TTL_SECONDS: int = 30 * 60

    def __init__(self) -> None:
        self._state: dict[str, dict[str, Any]] = defaultdict(
            lambda: {
                "topic": "general",
                "current_goal": None,
                "recent_follow_ups": [],
                "last_activity": None,
            }
        )

    def get(self, session_id: str) -> dict[str, Any]:
        """Return current session state, clearing stale sessions first."""
        self._expire(session_id)
        return self._state[session_id]

    def update(
        self,
        session_id: str,
        *,
        topic: str | None = None,
        current_goal: str | None = None,
        follow_ups: list[str] | None = None,
    ) -> None:
        """Update session state."""
        state = self._state[session_id]
        if topic:
            state["topic"] = topic
        if current_goal is not None:
            state["current_goal"] = current_goal
        if follow_ups is not None:
            state["recent_follow_ups"] = follow_ups[-5:]
        state["last_activity"] = time.monotonic()

    def clear(self, session_id: str) -> None:
        """Clear a session."""
        self._state.pop(session_id, None)

    def _expire(self, session_id: str) -> None:
        """Remove a session if it has been inactive for too long."""
        state = self._state.get(session_id)
        if state is None:
            return
        last = state.get("last_activity")
        if last is not None and (time.monotonic() - last) > self.INACTIVITY_TTL_SECONDS:
            self.clear(session_id)
