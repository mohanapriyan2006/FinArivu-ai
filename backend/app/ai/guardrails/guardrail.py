from __future__ import annotations

import re

from app.ai.prompts.guardrails import GuardrailEngine, GuardrailResult
from app.ai.schemas.orchestration import ChatResponse
from app.core.logger import logger


class Guardrail:
    """High-level guardrail for the orchestration layer.

    Wraps the existing GuardrailEngine and adds SQL-injection, XSS, and
    educational response generation for policy violations.
    """

    SQL_PATTERNS: list[re.Pattern[str]] = [
        re.compile(r"(\b|;\s*)(select|insert|update|delete|drop|union|alter|exec|execute)\b", re.I),
        re.compile(r"(\b|\s)(--|#|/\*|\*/)"),
        re.compile(r"'\s*or\s*'\s*\d\s*=\s*\d"),
    ]

    XSS_PATTERNS: list[re.Pattern[str]] = [
        re.compile(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", re.I),
        re.compile(r"javascript:", re.I),
        re.compile(r"on\w+\s*=", re.I),
    ]

    INVESTMENT_RESPONSE: str = (
        "I cannot provide specific investment recommendations. "
        "For personalised advice, please consult a SEBI-registered "
        "investment advisor. I can, however, explain general concepts "
        "like SIPs, mutual funds, PPF, NPS, and tax-saving options."
    )

    POLICY_RESPONSES: dict[str, str] = {
        "prompt_injection": (
            "I detected an unusual request pattern. I can only assist "
            "with personal finance topics."
        ),
        "harmful_request": (
            "I can't help with that request. Please avoid sharing "
            "passwords, OTPs, or sensitive personal information."
        ),
        "non_financial": (
            "I specialise in personal finance topics for Indian "
            "professionals. Could you ask about budgeting, saving, "
            "taxes, loans, or retirement planning?"
        ),
        "sql_injection": (
            "I can't process that request because it looks like it may "
            "contain database commands. Please ask a finance question."
        ),
        "xss_attempt": (
            "I can't process that request because it looks like it may "
            "contain web code. Please ask a finance question."
        ),
        "investment_advice": INVESTMENT_RESPONSE,
    }

    def __init__(self) -> None:
        self._engine = GuardrailEngine()

    def check(self, message: str) -> GuardrailResult:
        """Run guardrail checks and PII masking on the user message."""
        lowered = message.lower()

        # Extra SQL/XSS checks in addition to the engine.
        if any(pattern.search(message) for pattern in self.SQL_PATTERNS):
            logger.warning("SQL-injection pattern blocked")
            return GuardrailResult(
                allowed=False,
                reason="sql_injection",
                sanitised_message="",
            )

        if any(pattern.search(message) for pattern in self.XSS_PATTERNS):
            logger.warning("XSS pattern blocked")
            return GuardrailResult(
                allowed=False,
                reason="xss_attempt",
                sanitised_message="",
            )

        # Delegate to existing engine for injection, harmful, scope, and PII.
        return self._engine.check(message)

    def is_investment_advice(self, message: str) -> bool:
        """Return True if the message asks for specific investment advice."""
        return self._engine.is_investment_advice_request(message)

    def build_response(self, reason: str) -> ChatResponse:
        """Return an educational/policy response for a blocked request."""
        text = self.POLICY_RESPONSES.get(
            reason,
            "I can only assist with personal finance topics for Indian salaried professionals.",
        )
        return ChatResponse(
            message=text,
            guardrail_triggered=True,
            disclaimer="This is educational information, not investment advice.",
        )
