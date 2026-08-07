from __future__ import annotations

import json
from typing import Any


class JSONValidator:
    """Validate and safely parse JSON from AI responses."""

    @staticmethod
    def validate(text: str) -> tuple[bool, dict[str, Any] | None, str]:
        """Return (is_valid, parsed_or_none, error_message)."""
        if not text or not text.strip():
            return False, None, "empty response"

        cleaned = text.strip()
        # Strip markdown code fences if present.
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

        # Remove actual whitespace and literal \\n line-separator sequences
        # that appear after code fences in one-line encoded responses.
        cleaned = cleaned.strip().removeprefix("\\n").removesuffix("\\n").strip()

        try:
            parsed = json.loads(cleaned)
            if not isinstance(parsed, dict):
                return False, None, "JSON is not an object"
            return True, parsed, ""
        except json.JSONDecodeError as exc:
            return False, None, f"invalid JSON: {exc}"

    @staticmethod
    def has_fields(data: dict[str, Any], required: list[str]) -> list[str]:
        """Return a list of missing required keys."""
        return [key for key in required if key not in data]
