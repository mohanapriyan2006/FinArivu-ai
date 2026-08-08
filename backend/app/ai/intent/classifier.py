from __future__ import annotations

import re
from typing import Any

from app.ai.schemas.orchestration import IntentEnum, IntentResult
from app.core.logger import logger


class IntentClassifier:
    """Lightweight rule-based intent classifier with optional LLM fallback.

    Step 1: keyword/regex rules determine the primary intent and confidence.
    Step 2: if confidence is low, a small LLM call may be used to resolve it.
    """

    INTENT_KEYWORDS: dict[IntentEnum, list[str]] = {
        IntentEnum.BUDGET: [
            "budget", "monthly budget", "spending limit", "budgeted",
            "allocation", "spend limit",
        ],
        IntentEnum.EXPENSE: [
            "expense", "expenses", "spend", "spending", "spent on", "how much did",
            "utilisation", "utilization", "overspend", "savings rate", "monthly spend",
        ],
        IntentEnum.GOAL: [
            "goal", "goals", "house", "car", "vacation", "target", "saving for",
            "corpus for", "future expense",
        ],
        IntentEnum.RETIREMENT: [
            "retire", "retirement", "pension", "nps", "corpus", "post retirement",
            "future monthly expense",
        ],
        IntentEnum.TAX: [
            "tax", "taxes", "regime", "80c", "80d", "deduction", "hra", "lta",
            "tds", "itr", "filing",
        ],
        IntentEnum.HEALTH: [
            "health", "health score", "financial health", "debt ratio",
            "emergency fund", "net worth",
        ],
        IntentEnum.NETWORTH: [
            "net worth", "assets", "liabilities", "wealth", "portfolio",
        ],
        IntentEnum.EDUCATION: [
            "explain", "what is", "how does", "inflation", "compound", "fd", "rd",
            "learn", "teach me", "meaning of",
        ],
        IntentEnum.INVESTMENT_EDUCATION: [
            "mutual fund", "sip", "ppf", "elss", "nps", "stock", "equity", "debt fund",
            "index fund", "etf", "rebalance",
        ],
        IntentEnum.UNSUPPORTED_INVESTMENT_ADVICE: [
            "which fund", "which stock", "should i buy", "should i sell",
            "best mutual fund", "recommend a stock", "top stocks", "top funds",
        ],
        IntentEnum.CASH_FLOW: [
            "cash flow", "inflow", "outflow", "cashflow", "money in", "money out",
        ],
        IntentEnum.SCENARIO: [
            "what if", "scenario", "how much do i need", "how much should i save",
            "can i afford", "impact of saving", "if i save",
        ],
        IntentEnum.REPORT: [
            "report", "weekly report", "monthly report", "summary", "overview",
            "dashboard",
        ],
        IntentEnum.GREETING: [
            "hello", "hi", "hey", "namaste", "good morning", "good evening",
            "how are you", "who are you",
        ],
    }

    ENTITY_PATTERNS: dict[str, re.Pattern[str]] = {
        "amount": re.compile(r"[₹$€£]?\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s?(?:lakh|lac|crore|k|thousand|million))?"),
        "years": re.compile(r"(\d{1,2})\s*(?:years?|yrs?)"),
        "months": re.compile(r"(\d{1,3})\s*(?:months?|mos?)"),
        "percentage": re.compile(r"(\d{1,2}(?:\.\d+)?)\s*%"),
    }

    def classify(self, message: str, *, use_llm: bool = False) -> IntentResult:
        """Classify the user message into a supported intent."""
        lowered = message.lower()

        # Rule-based scoring.
        scores: dict[IntentEnum, int] = {}
        for intent, keywords in self.INTENT_KEYWORDS.items():
            score = sum(2 if kw in lowered else 0 for kw in keywords)
            if score:
                scores[intent] = score

        if not scores:
            logger.debug("No keyword match; using general intent for: %s", message[:80])
            return IntentResult(
                intent=IntentEnum.GENERAL,
                confidence=1.0,
                entities=self._extract_entities(message),
            )

        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_intent, top_score = sorted_scores[0]

        # If two intents score within 2 points, treat as mixed.
        if len(sorted_scores) > 1 and (top_score - sorted_scores[1][1]) <= 2:
            requested = [i.value for i, _ in sorted_scores[:3]]
            return IntentResult(
                intent=IntentEnum.MIXED,
                confidence=round(top_score / (top_score + sorted_scores[1][1]), 2),
                entities=self._extract_entities(message),
                requested_modules=requested,
            )

        confidence = min(1.0, round(top_score / 10, 2))

        if use_llm and confidence < 0.5:
            # Optional LLM fallback for ambiguous inputs.
            logger.debug("Low confidence %s; could call LLM fallback", confidence)

        return IntentResult(
            intent=top_intent,
            confidence=confidence,
            entities=self._extract_entities(message),
            requested_modules=[top_intent.value],
        )

    def _extract_entities(self, message: str) -> dict[str, Any]:
        """Extract simple financial entities from the message."""
        entities: dict[str, list[str]] = {}
        for name, pattern in self.ENTITY_PATTERNS.items():
            matches = pattern.findall(message)
            if matches:
                entities[name] = [m if isinstance(m, str) else m[0] for m in matches]
        return entities
