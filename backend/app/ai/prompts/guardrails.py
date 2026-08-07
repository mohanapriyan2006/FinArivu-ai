"""Guardrail engine for the AI Copilot.

Runs *before* any LLM call to block harmful requests, off-topic messages,
prompt injection attempts, and to mask PII from outgoing prompts.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import ClassVar

from app.core.logger import logger


@dataclass(frozen=True)
class GuardrailResult:
    """Outcome of running the guardrail checks on a user message."""

    allowed: bool
    reason: str = ""
    sanitised_message: str = ""


class GuardrailEngine:
    """Pre-LLM safety layer for the copilot.

    The engine runs four checks in order.  The first failing check short-
    circuits and returns a blocked ``GuardrailResult``.  If all checks pass
    the message is PII-masked and returned as allowed.
    """

    # ── Keyword lists ─────────────────────────────────────────────────

    HARMFUL_KEYWORDS: ClassVar[list[str]] = [
        "password", "otp", "pin", "cvv", "credit card number",
        "account number", "login", "sign in", "authenticate",
        "secret key", "private key", "aadhaar", "pan number",
    ]

    FINANCIAL_KEYWORDS: ClassVar[list[str]] = [
        "budget", "expense", "income", "salary", "saving", "savings",
        "invest", "investment", "mutual fund", "sip", "stock", "ppf",
        "epf", "nps", "tax", "taxes", "tds", "gst", "loan", "emi",
        "debt", "credit card", "insurance", "retirement", "pension",
        "goal", "net worth", "asset", "liability", "financial", "money",
        "rupee", "inr", "80c", "80d", "hra", "lta", "deduction",
        "filing", "itr", "pf", "health insurance", "emergency fund",
        "emergency", "fund", "wealth", "corpus", "inflation",
        "interest", "compound", "fd", "fixed deposit", "rd",
        "recurring deposit", "elss", "section", "regime",
        # Greetings and meta are allowed through as "general" intent.
        "hello", "hi", "hey", "namaste", "thanks", "thank you",
        "help", "what can you do", "who are you",
    ]

    INVESTMENT_ADVICE_PATTERNS: ClassVar[list[str]] = [
        r"(should|shall|can i|recommend).*(buy|invest|sell|hold|stock|fund|share)",
        r"which (stock|fund|scheme|plan|investment) (should|to|is best)",
        r"best (mutual fund|stock|investment|sip|scheme)",
        r"where (should|to) invest",
        r"give me (a )?stock tip",
    ]

    # Prompt injection / jailbreak patterns.
    INJECTION_PATTERNS: ClassVar[list[str]] = [
        r"ignore (all )?(previous|above|prior) (instructions|prompts|rules)",
        r"you are now",
        r"act as (a |an )?(?!financial)",
        r"forget (your|all) (rules|instructions|constraints)",
        r"system prompt",
        r"reveal (your|the) (prompt|instructions)",
        r"do anything now",
        r"pretend (you are|to be)",
    ]

    # PII patterns for masking.
    _PII_PATTERNS: ClassVar[list[tuple[re.Pattern[str], str]]] = [
        (re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"), "[AADHAAR_MASKED]"),
        (re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"), "[PAN_MASKED]"),
        (re.compile(r"\b\d{9,18}\b"), "[ACCOUNT_MASKED]"),
        (re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"), "[CARD_MASKED]"),
    ]

    # ── Public API ────────────────────────────────────────────────────

    def check(self, message: str) -> GuardrailResult:
        """Run all guardrail checks and return the result.

        Checks are executed in severity order:
        1. Prompt injection detection
        2. Harmful / sensitive data request
        3. Financial scope check
        4. PII masking (applied to allowed messages)
        """
        lowered = message.lower()

        # 1. Prompt injection
        if self._is_injection(lowered):
            logger.warning("Prompt injection blocked: %s", message[:80])
            return GuardrailResult(
                allowed=False,
                reason="prompt_injection",
                sanitised_message="",
            )

        # 2. Harmful content
        if self._is_harmful(lowered):
            return GuardrailResult(
                allowed=False,
                reason="harmful_request",
                sanitised_message="",
            )

        # 3. Financial scope
        if not self._is_financial(lowered):
            return GuardrailResult(
                allowed=False,
                reason="non_financial",
                sanitised_message="",
            )

        # 4. PII masking on allowed messages
        sanitised = self._mask_pii(message)

        return GuardrailResult(
            allowed=True,
            reason="",
            sanitised_message=sanitised,
        )

    def is_investment_advice_request(self, message: str) -> bool:
        """Return True if the message asks for specific investment advice."""
        lowered = message.lower()
        return any(
            re.search(pattern, lowered)
            for pattern in self.INVESTMENT_ADVICE_PATTERNS
        )

    # ── Private helpers ───────────────────────────────────────────────

    @classmethod
    def _is_injection(cls, lowered: str) -> bool:
        return any(re.search(p, lowered) for p in cls.INJECTION_PATTERNS)

    @classmethod
    def _is_harmful(cls, lowered: str) -> bool:
        return any(kw in lowered for kw in cls.HARMFUL_KEYWORDS)

    @classmethod
    def _is_financial(cls, lowered: str) -> bool:
        return any(kw in lowered for kw in cls.FINANCIAL_KEYWORDS)

    @classmethod
    def _mask_pii(cls, text: str) -> str:
        for pattern, replacement in cls._PII_PATTERNS:
            text = pattern.sub(replacement, text)
        return text
