from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_providers import get_chat_client
from app.core.logger import logger
from app.models.ai_conversations import AIConversation
from app.repositories.ai_conversations import AIConversationRepository
from app.schemas.chat import ChatMessage, ChatResponse


SYSTEM_PROMPT = """You are FinArivu, a helpful personal finance assistant for Indian salaried professionals.

Guidelines:
- Answer only personal finance, budgeting, saving, tax, retirement, and money management questions relevant to Indian context.
- Do not provide specific investment recommendations (e.g., "buy this stock", "invest in this fund", "choose this scheme").
- Avoid predicting market returns or promising investment outcomes.
- Encourage users to consult a SEBI-registered investment advisor for personalized advice.
- Never ask for passwords, OTPs, or sensitive authentication information.
- If a user shares PAN, Aadhaar, or bank account numbers, do not store or repeat them.

Disclaimer: The information provided is for educational purposes only and is not financial, investment, tax, or legal advice.
"""


FINANCIAL_KEYWORDS = [
    "budget", "expense", "income", "salary", "saving", "savings", "invest", "investment",
    "mutual fund", "sip", "stock", "ppf", "epf", "nps", "tax", "taxes", "tds", "gst",
    "loan", "emi", "debt", "credit card", "insurance", "retirement", "pension",
    "goal", "net worth", "asset", "liability", "financial", "money", "rupee", "inr",
    "80c", "80d", "hra", "lta", "deduction", "filing", "itr", "pf", "health insurance",
    "emergency fund", "emergency", "fund",
]


HARMFUL_KEYWORDS = [
    "password", "otp", "pin", "cvv", "credit card number", "account number",
    "login", "sign in", "authenticate", "secret key", "private key", "aadhaar", "pan number",
]


class ChatbotService:
    """Service for the AI financial chatbot with guardrails."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AIConversationRepository(session)
        self._ai_client: Any | None = None
        self._ai_provider: Any | None = None
        client_pair = get_chat_client()
        if client_pair:
            self._ai_client, self._ai_provider = client_pair

    async def process_message(
        self,
        user_id: uuid.UUID,
        chat_message: ChatMessage,
    ) -> ChatResponse:
        """Process a user message and return a guarded assistant response."""
        message = chat_message.message.strip()
        if not message:
            return ChatResponse(
                message="I didn't receive a message. How can I help with your finances today?",
                guardrail_triggered=False,
                disclaimer="",
            )

        if self._contains_harmful(message):
            await self._store_message(user_id, chat_message.session_id, "user", message, blocked=True, block_reason="harmful_request")
            return ChatResponse(
                message="I can't help with that request. Please avoid sharing passwords, OTPs, or sensitive personal information.",
                guardrail_triggered=True,
                disclaimer="",
            )

        if not self._is_financial(message):
            await self._store_message(user_id, chat_message.session_id, "user", message, blocked=True, block_reason="non_financial")
            return ChatResponse(
                message="I specialize in personal finance topics for Indian professionals. Could you ask about budgeting, saving, taxes, loans, or retirement planning?",
                guardrail_triggered=True,
                disclaimer="",
            )

        await self._store_message(user_id, chat_message.session_id, "user", message)

        if self._investment_advice_request(message):
            response_text = (
                "I can't provide specific investment recommendations. For personalized advice, "
                "please consult a SEBI-registered investment advisor. I can, however, explain general "
                "concepts like SIPs, mutual funds, PPF, NPS, and tax-saving options."
            )
            await self._store_message(user_id, chat_message.session_id, "assistant", response_text)
            return ChatResponse(
                message=response_text,
                guardrail_triggered=True,
                disclaimer="This is educational information, not investment advice.",
            )

        response_text = await self._generate_response(user_id, chat_message.session_id, message)

        await self._store_message(user_id, chat_message.session_id, "assistant", response_text)

        return ChatResponse(
            message=response_text,
            guardrail_triggered=False,
            disclaimer="The information provided is for educational purposes only and is not financial, investment, tax, or legal advice.",
        )

    @staticmethod
    def _contains_harmful(message: str) -> bool:
        lowered = message.lower()
        return any(keyword in lowered for keyword in HARMFUL_KEYWORDS)

    @staticmethod
    def _is_financial(message: str) -> bool:
        lowered = message.lower()
        return any(keyword in lowered for keyword in FINANCIAL_KEYWORDS)

    @staticmethod
    def _investment_advice_request(message: str) -> bool:
        lowered = message.lower()
        patterns = [
            r"(should|shall|can i|recommend).*(buy|invest|sell|hold|stock|fund|share)",
            r"which (stock|fund|scheme|plan|investment) (should|to|is best)",
            r"best (mutual fund|stock|investment|sip|scheme)",
            r"where (should|to) invest",
            r"give me (a )?stock tip",
        ]
        return any(re.search(pattern, lowered) for pattern in patterns)

    async def _generate_response(self, user_id: uuid.UUID, session_id: str, message: str) -> str:
        if self._ai_client and self._ai_provider:
            try:
                return await self._call_provider(user_id, session_id, message)
            except Exception as exc:
                logger.warning("AI provider call failed: %s", exc)

        return self._default_response(message)

    async def _call_provider(self, user_id: uuid.UUID, session_id: str, message: str) -> str:
        history = await self._repo.get_recent_history(user_id, session_id, limit=6)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for item in history:
            role = item.role if item.role in {"user", "assistant"} else "assistant"
            messages.append({"role": role, "content": item.message})
        messages.append({"role": "user", "content": message})

        response = await self._ai_client.chat.completions.create(
            model=self._ai_provider.model,
            messages=messages,
            temperature=0.3,
            max_tokens=512,
        )
        return response.choices[0].message.content or ""

    @staticmethod
    def _default_response(message: str) -> str:
        lowered = message.lower()
        if "budget" in lowered:
            return (
                "A good budget follows the 50/30/20 rule: 50% needs, 30% wants, and 20% savings/debt. "
                "Track your expenses for a month to see where your money goes."
            )
        if "tax" in lowered or "80c" in lowered or "80d" in lowered:
            return (
                "In India, common tax-saving options under the old regime include Section 80C (ELSS, PPF, EPF, LIC), "
                "80D (health insurance), and HRA. Compare the old vs new tax regime to see which suits you."
            )
        if "retirement" in lowered:
            return (
                "Start retirement planning by estimating your future monthly expenses adjusted for inflation. "
                "Use the 4% rule to approximate the corpus needed."
            )
        if "sip" in lowered or "mutual fund" in lowered:
            return (
                "SIPs help average out market volatility through regular investing. "
                "They do not guarantee returns; choose funds based on your goals and risk appetite, ideally with a SEBI-registered advisor."
            )
        if "loan" in lowered or "emi" in lowered:
            return (
                "Keep total EMIs within 40-50% of your monthly income. Shorter tenures reduce total interest paid."
            )
        if "emergency" in lowered:
            return (
                "An emergency fund should cover 3-6 months of essential expenses and be kept in a liquid, safe account. "
                "Start by saving a small amount each month until you reach your target."
            )
        return (
            "I'm here to help with personal finance questions like budgeting, saving, taxes, loans, and retirement planning. "
            "How can I assist?"
        )

    async def _store_message(
        self,
        user_id: uuid.UUID,
        session_id: str,
        role: str,
        message: str,
        blocked: bool = False,
        block_reason: str | None = None,
    ) -> None:
        convo = AIConversation(
            user_id=user_id,
            session_id=session_id,
            role=role,
            message=message[:2000],
            blocked=blocked,
            block_reason=block_reason,
        )
        await self._repo.create(convo)
