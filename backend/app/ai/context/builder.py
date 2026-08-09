from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.context.domain import FinancialDomain
from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.schemas.orchestration import FinancialContext
from app.services.financial_profile import FinancialProfileService


class ContextBuilder:
    """Loads only the required user data and builds a FinancialContext.

    Agents must not query the database; they receive the FinancialContext
    built by this class.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._memory = ConversationMemory(session)
        self._service = FinancialProfileService(session)

    async def build(
        self,
        user_id: uuid.UUID,
        session_id: str,
        required_domains: list[FinancialDomain] | None = None,
    ) -> FinancialContext:
        """Load the financial context for a user, filtered by required domains.

        A compact ``user_snapshot`` is always loaded (regardless of
        ``required_domains``) so the ResponseBuilder can include the user's
        financial details in every LLM prompt for personalisation.
        """
        if required_domains is None:
            required: set[FinancialDomain] = set(FinancialDomain)
        else:
            required = set(required_domains)

        # Always load the full profile + summary for the user snapshot.
        financial_profile = await self._service.get_full_profile(user_id)
        summary = await self._build_conversation_summary(user_id, session_id)
        user_snapshot = self._build_user_snapshot(financial_profile, user_id)

        if not required:
            return FinancialContext(
                conversation_summary=summary,
                user_snapshot=user_snapshot,
            )

        available: list[str] = []
        missing: list[str] = []

        income: dict[str, Any] = {}
        if FinancialDomain.INCOME in required:
            income = financial_profile.get("income") or {}
            if income.get("monthly_take_home") is not None:
                available.append(FinancialDomain.INCOME.value)
            else:
                missing.append(FinancialDomain.INCOME.value)

        expenses: dict[str, Any] = {}
        if FinancialDomain.EXPENSES in required:
            expenses = financial_profile.get("expenses") or {}
            if expenses.get("monthly_estimate") is not None:
                available.append(FinancialDomain.EXPENSES.value)
            else:
                missing.append(FinancialDomain.EXPENSES.value)

        savings: dict[str, Any] = {}
        if FinancialDomain.SAVINGS in required:
            savings = financial_profile.get("savings") or {}
            if savings.get("total", 0) > 0:
                available.append(FinancialDomain.SAVINGS.value)
            else:
                missing.append(FinancialDomain.SAVINGS.value)

        investments: dict[str, Any] = {}
        if FinancialDomain.INVESTMENTS in required:
            inv_list = financial_profile.get("investments") or []
            investments = {
                "total": float(sum(item.get("value", 0) for item in inv_list)),
                "items": inv_list,
            }
            if inv_list:
                available.append(FinancialDomain.INVESTMENTS.value)
            else:
                missing.append(FinancialDomain.INVESTMENTS.value)

        fixed_deposits: list[dict[str, Any]] = []
        if FinancialDomain.FIXED_DEPOSITS in required:
            fixed_deposits = financial_profile.get("fixed_deposits") or []
            if fixed_deposits:
                available.append(FinancialDomain.FIXED_DEPOSITS.value)
            else:
                missing.append(FinancialDomain.FIXED_DEPOSITS.value)

        loans: list[dict[str, Any]] = []
        if FinancialDomain.LOANS in required:
            loans = financial_profile.get("loans") or []
            if loans:
                available.append(FinancialDomain.LOANS.value)
            else:
                missing.append(FinancialDomain.LOANS.value)

        credit_cards: list[dict[str, Any]] = []
        if FinancialDomain.CREDIT_CARDS in required:
            credit_cards = financial_profile.get("credit_cards") or []
            if credit_cards:
                available.append(FinancialDomain.CREDIT_CARDS.value)
            else:
                missing.append(FinancialDomain.CREDIT_CARDS.value)

        goals: list[dict[str, Any]] = []
        if FinancialDomain.GOALS in required:
            goals = financial_profile.get("goals") or []
            if goals:
                available.append(FinancialDomain.GOALS.value)
            else:
                missing.append(FinancialDomain.GOALS.value)

        insurance: list[dict[str, Any]] = []
        if FinancialDomain.INSURANCE in required:
            insurance = financial_profile.get("insurance") or []
            if insurance:
                available.append(FinancialDomain.INSURANCE.value)
            else:
                missing.append(FinancialDomain.INSURANCE.value)

        tax_profile: dict[str, Any] = {}
        if FinancialDomain.TAX in required:
            tax_profile = financial_profile.get("tax_profile") or {}
            if tax_profile:
                available.append(FinancialDomain.TAX.value)
            else:
                missing.append(FinancialDomain.TAX.value)

        profile: dict[str, Any] = {}
        if FinancialDomain.PROFILE in required:
            profile = financial_profile.get("profile") or {}
            if profile and profile.get("age") is not None:
                available.append(FinancialDomain.PROFILE.value)
            else:
                missing.append(FinancialDomain.PROFILE.value)

        net_worth: dict[str, Any] = {}
        cash_flow: dict[str, Any] = {}
        if FinancialDomain.NET_WORTH in required or FinancialDomain.CASH_FLOW in required:
            sum_data = await self._service.get_summary(user_id)
            if FinancialDomain.NET_WORTH in required:
                net_worth = {
                    "total_assets": sum_data.get("total_assets", 0),
                    "total_liabilities": sum_data.get("total_liabilities", 0),
                    "net_worth": sum_data.get("net_worth", 0),
                }
            if FinancialDomain.CASH_FLOW in required:
                cash_flow = {
                    "monthly_income": sum_data.get("monthly_income", 0),
                    "monthly_emi_total": sum_data.get("monthly_emi_total", 0),
                    "credit_card_outstanding": sum_data.get("credit_card_outstanding", 0),
                }

        health_score: dict[str, Any] = {}
        if FinancialDomain.HEALTH in required:
            health_score = await self._health_score(user_id)

        tax_regime = tax_profile.get("tax_regime") if tax_profile else None

        return FinancialContext(
            version="1.0",
            profile=profile,
            income=income,
            expenses=expenses,
            budgets=[],
            savings=savings,
            investments=investments,
            fixed_deposits=fixed_deposits,
            loans=loans,
            credit_cards=credit_cards,
            goals=goals,
            insurance=insurance,
            tax_profile=tax_profile,
            assets=financial_profile.get("investments", [])
            + financial_profile.get("fixed_deposits", [])
            + ([] if FinancialDomain.SAVINGS not in required else []),
            liabilities=financial_profile.get("loans", [])
            + financial_profile.get("credit_cards", []),
            net_worth=net_worth,
            cash_flow=cash_flow,
            health_score=health_score,
            tax_regime=tax_regime,
            conversation_summary=summary,
            preferences=profile.get("preferences", {}) if profile else {},
            data_available=available,
            data_missing=missing,
            user_snapshot=user_snapshot,
        )

    async def _health_score(self, user_id: uuid.UUID) -> dict[str, Any]:
        """Return latest health score snapshot if available."""
        from app.engines.health_score import FinancialHealthEngine

        engine = FinancialHealthEngine()
        return engine.calculate({})

    async def _build_conversation_summary(self, user_id: uuid.UUID, session_id: str) -> str:
        """Generate a compact summary from recent messages."""
        messages = await self._memory.get_session_messages(user_id, session_id, limit=8)
        if not messages:
            return "No prior conversation in this session."

        lines = [f"{m.role}: {m.content[:120]}" for m in messages]
        return "\n".join(lines)

    @staticmethod
    def _build_user_snapshot(
        financial_profile: dict[str, Any],
        user_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Build a compact, LLM-friendly snapshot of the user's finances.

        This is always loaded regardless of which agents are planned, so the
        ResponseBuilder can include it in every LLM prompt for personalisation.
        """
        profile = financial_profile.get("profile") or {}
        income = financial_profile.get("income") or {}
        expenses = financial_profile.get("expenses") or {}
        savings = financial_profile.get("savings") or {}
        investments = financial_profile.get("investments") or []
        fixed_deposits = financial_profile.get("fixed_deposits") or []
        loans = financial_profile.get("loans") or []
        credit_cards = financial_profile.get("credit_cards") or []
        goals = financial_profile.get("goals") or []
        insurance = financial_profile.get("insurance") or []
        tax_profile = financial_profile.get("tax_profile") or {}

        total_investments = sum(
            float(item.get("value", 0)) for item in investments
        )
        total_fd = sum(float(item.get("value", 0)) for item in fixed_deposits)
        total_loans = sum(float(item.get("amount", 0)) for item in loans)
        total_card_outstanding = sum(
            float(item.get("amount", 0)) for item in credit_cards
        )
        total_assets = (
            float(savings.get("total", 0))
            + total_investments
            + total_fd
        )
        total_liabilities = total_loans + total_card_outstanding
        net_worth = total_assets - total_liabilities

        return {
            "profile": {
                "age": profile.get("age"),
                "employment_type": profile.get("employment_type"),
                "city": profile.get("city"),
                "dependents": profile.get("dependents"),
                "children": profile.get("children_count"),
                "retirement_age": profile.get("retirement_age"),
            },
            "monthly_income": income.get("monthly_take_home"),
            "monthly_expenses": expenses.get("monthly_estimate"),
            "savings": {
                "total": float(savings.get("total", 0)),
                "emergency_fund": float(savings.get("emergency_fund", 0)),
                "general_savings": float(savings.get("general_savings", 0)),
                "goal_savings": float(savings.get("goal_savings", 0)),
            },
            "investments": {
                "total": total_investments,
                "count": len(investments),
                "types": list(
                    {item.get("asset_type", "Unknown") for item in investments}
                ),
            },
            "fixed_deposits": {
                "total": total_fd,
                "count": len(fixed_deposits),
            },
            "loans": {
                "total_outstanding": total_loans,
                "count": len(loans),
                "total_emi": sum(
                    float(item.get("emi", 0) or 0) for item in loans
                ),
            },
            "credit_cards": {
                "total_outstanding": total_card_outstanding,
                "count": len(credit_cards),
            },
            "goals": {
                "count": len(goals),
                "items": [
                    {
                        "name": g.get("goal_name", "Unnamed"),
                        "target": float(g.get("target_amount", 0)),
                        "current": float(g.get("current_amount", 0)),
                        "target_date": str(g.get("target_date", "")),
                    }
                    for g in goals
                ],
            },
            "insurance": {
                "count": len(insurance),
                "policies": [
                    {
                        "type": p.get("insurance_type", "Unknown"),
                        "coverage": float(p.get("coverage_amount", 0) or 0),
                        "annual_premium": float(p.get("annual_premium", 0) or 0),
                    }
                    for p in insurance
                ],
            },
            "tax_regime": tax_profile.get("tax_regime") if tax_profile else None,
            "totals": {
                "total_assets": total_assets,
                "total_liabilities": total_liabilities,
                "net_worth": net_worth,
            },
        }
