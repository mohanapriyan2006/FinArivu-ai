from __future__ import annotations

import re

from app.ai.guardrails.guardrail import Guardrail
from app.ai.schemas.orchestration import ChatResponse
from app.core.logger import logger


class GuardrailService:
    """High-level guardrail service with PII masking and policy enforcement."""

    # Patterns for common sensitive data.
    PII_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
        ("pan", re.compile(r"[A-Z]{5}[0-9]{4}[A-Z]", re.I)),
        ("aadhaar", re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")),
        ("credit_card", re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")),
        ("bank_account", re.compile(r"\b\d{9,18}\b")),
        ("phone", re.compile(r"\b(?:\+?91[-\s]?)?[6-9]\d{9}\b")),
        ("email", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")),
    ]

    def __init__(self) -> None:
        self._guardrail = Guardrail()

    def mask_pii(self, text: str) -> str:
        """Mask PAN, Aadhaar, credit card, account, phone, and email."""
        masked = text
        for kind, pattern in self.PII_PATTERNS:
            if kind == "pan":
                masked = pattern.sub("***PAN***", masked)
            elif kind == "aadhaar":
                masked = pattern.sub("XXXX-XXXX-XXXX", masked)
            elif kind == "credit_card":
                masked = pattern.sub("XXXX-XXXX-XXXX-XXXX", masked)
            elif kind == "bank_account":
                masked = pattern.sub("***ACCOUNT***", masked)
            elif kind == "phone":
                masked = pattern.sub("***PHONE***", masked)
            elif kind == "email":
                masked = pattern.sub("***EMAIL***", masked)
        return masked

    def check(self, message: str) -> dict[str, Any]:
        """Run all guardrail checks and return a result dict."""
        masked = self.mask_pii(message)
        result = self._guardrail.check(masked)

        if not result.allowed:
            logger.warning("Guardrail blocked: %s", result.reason)
            response = self._guardrail.build_response(result.reason or "policy_violation")
            return {
                "allowed": False,
                "reason": result.reason,
                "sanitised_message": "",
                "response": response,
            }

        return {
            "allowed": True,
            "reason": "",
            "sanitised_message": masked,
            "response": None,
        }
