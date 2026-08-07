from __future__ import annotations

import re
from typing import Any

from app.ai.validator.json_validator import JSONValidator


class ResponseValidator:
    """Validates AI-generated text for safety, policy, and data integrity."""

    UNSAFE_PATTERNS: list[re.Pattern[str]] = [
        re.compile(r"\b(?:buy|sell|invest in)\s+\w+\s+(?:stock|fund|share)\b", re.I),
        re.compile(r"\b(?:stock tip|portfolio advice|trading signal)\b", re.I),
        re.compile(r"\b(double your money|guaranteed return|sure profit)\b", re.I),
    ]

    def __init__(self) -> None:
        self._json_validator = JSONValidator()

    def validate(
        self,
        response: str,
        *,
        required_fields: list[str] | None = None,
        expected_numbers: list[tuple[str, float]] | None = None,
    ) -> tuple[bool, str]:
        """Return (valid, reason) for a given AI response."""
        if not response or not response.strip():
            return False, "empty response"

        if self._is_unsafe(response):
            return False, "unsafe or advisory content detected"

        if required_fields:
            is_json, data, _ = self._json_validator.validate(response)
            if not is_json:
                # Not all responses are JSON; don't fail if not required.
                pass
            elif data:
                missing = JSONValidator.has_fields(data, required_fields)
                if missing:
                    return False, f"missing fields: {', '.join(missing)}"

        if expected_numbers:
            is_json, data, _ = self._json_validator.validate(response)
            if is_json and data:
                for field, value in expected_numbers:
                    actual = data.get(field)
                    if actual is not None and float(actual) != float(value):
                        return False, f"calculation mismatch for {field}"

        return True, ""

    def _is_unsafe(self, response: str) -> bool:
        """Detect policy-violating content."""
        return any(pattern.search(response) for pattern in self.UNSAFE_PATTERNS)
