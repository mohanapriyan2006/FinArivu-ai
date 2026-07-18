from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_providers import get_all_chat_clients
from app.core.logger import logger
from app.models.ai_conversations import AIConversation
from app.repositories.ai_conversations import AIConversationRepository
from app.schemas.chat import ChatMessage, ChatResponse


SYSTEM_PROMPT = """You are FinArivu, a professional personal-finance assistant for Indian salaried professionals.

Response style:
- Be clear, concise, and professional with a warm, respectful tone.
- Answer the user's most recent question directly. Do not start every response with "Namaste" or a greeting.
- Ground advice in the Indian context: use INR, Section 80C/80D, ELSS, PPF, EPF, NPS, SIPs, EMIs, old vs new tax regimes, and other local instruments where relevant.
- Use numbered steps or short bullet points only when they improve clarity. Avoid unnecessary Markdown like ** or *.
- Never recommend specific stocks, mutual funds, or schemes by name.
- Never ask for passwords, OTPs, PAN, Aadhaar, or bank account numbers.
- Do not predict market returns or promise specific investment outcomes.
- Provide educational guidance only; do not add your own disclaimer text.

If the user asks for personalised investment advice, decline and recommend consulting a SEBI-registered investment advisor.
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
        self._ai_clients: list[tuple[Any, Any]] = get_all_chat_clients()

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
        for client, provider in self._ai_clients:
            try:
                return await self._call_provider(client, provider, user_id, session_id, message)
            except Exception as exc:
                logger.warning("%s provider call failed: %s", provider.name, exc)

        return self._default_response(message)

    async def _call_provider(
        self,
        client: Any,
        provider: Any,
        user_id: uuid.UUID,
        session_id: str,
        message: str,
    ) -> str:
        history = await self._repo.get_recent_history(user_id, session_id, limit=6)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for item in history:
            role = item.role if item.role in {"user", "assistant"} else "assistant"
            messages.append({"role": role, "content": item.message})
        messages.append({"role": "user", "content": message})

        response = await client.chat.completions.create(
            model=provider.model,
            messages=messages,
            temperature=0.4,
            max_tokens=1024,
            top_p=0.9,
            timeout=30.0,
        )
        return response.choices[0].message.content or ""

    @staticmethod
    def _default_response(message: str) -> str:
        lowered = message.lower()
        if "budget" in lowered:
            return (
                "A practical Indian budget follows the 50/30/20 guideline: 50% for needs, 30% for wants, "
                "and 20% for savings and debt repayment. Track your expenses for a month, then allocate "
                "funds based on your actual spending and goals."
            )
        if "tax" in lowered or "80c" in lowered or "80d" in lowered or "deduction" in lowered:
            return (
                "In India, the old tax regime offers deductions under Section 80C (ELSS, PPF, EPF, LIC), "
                "Section 80D (health insurance), and HRA. The new regime has lower tax rates but fewer "
                "deductions. Choose the one that gives you the lower tax outgo."
            )
        if "retirement" in lowered or "pension" in lowered:
            return (
                "Start retirement planning by estimating your future monthly expenses adjusted for inflation. "
                "Build a mix of EPF/PPF, NPS, and mutual funds, and aim for a corpus that can sustain a "
                "safe withdrawal rate over 25-30 years."
            )
        if "sip" in lowered or "mutual fund" in lowered:
            return (
                "SIPs help average out market volatility through regular investing. Returns are not guaranteed, "
                "so pick funds that match your goals and risk appetite, ideally with a SEBI-registered advisor."
            )
        if "loan" in lowered or "emi" in lowered or "debt" in lowered:
            return (
                "Keep total EMIs within 40-50% of your monthly take-home income. Shorter tenures reduce "
                "total interest, but ensure you have enough liquidity for emergencies."
            )
        if "emergency" in lowered:
            return (
                "An emergency fund should cover 3-6 months of essential expenses and be kept in liquid, "
                "low-risk instruments such as a savings account, sweep-in FD, or overnight/liquid funds."
            )
        return (
            "I am FinArivu, your personal-finance assistant for Indian salaried professionals. "
            "I can help with budgeting, saving, taxes, loans, retirement, and investment concepts. What would you like to know?"
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
