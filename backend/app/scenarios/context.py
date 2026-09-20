"""ScenarioContext — the real financial baseline every simulation uses.

Built from the same repositories/services the rest of the app trusts
(``FinancialProfileService`` + record-level aggregates). The client never
supplies baseline values; everything here is loaded server-side for the
authenticated user.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.categories import ExpenseCategoryRepository
from app.repositories.expenses import ExpenseRepository
from app.services.financial_profile import FinancialProfileService


@dataclass
class ScenarioContext:
    """Compact, simulation-ready snapshot of a user's financial position."""

    monthly_income: Decimal | None = None
    monthly_expenses: Decimal | None = None
    # Category display name (lower-cased) → average monthly spend.
    expense_by_category: dict[str, Decimal] = field(default_factory=dict)
    budgets: list[dict[str, Any]] = field(default_factory=list)
    goals: list[dict[str, Any]] = field(default_factory=list)
    loans: list[dict[str, Any]] = field(default_factory=list)
    emergency_fund: Decimal | None = None
    cash_savings: Decimal | None = None
    total_assets: Decimal | None = None
    total_liabilities: Decimal | None = None
    net_worth: Decimal | None = None
    monthly_emi_total: Decimal = Decimal("0")
    current_age: int | None = None
    retirement_age: int | None = None
    data_available: list[str] = field(default_factory=list)
    data_missing: list[str] = field(default_factory=list)

    @property
    def monthly_surplus(self) -> Decimal | None:
        if self.monthly_income is None or self.monthly_expenses is None:
            return None
        return self.monthly_income - self.monthly_expenses

    @property
    def savings_rate(self) -> float | None:
        if not self.monthly_income or self.monthly_income <= 0:
            return None
        surplus = self.monthly_surplus
        if surplus is None:
            return None
        return float(surplus / self.monthly_income)

    @property
    def runway_months(self) -> float | None:
        if not self.monthly_expenses or self.monthly_expenses <= 0:
            return None
        if self.cash_savings is None:
            return None
        return float(self.cash_savings / self.monthly_expenses)


class ScenarioContextBuilder:
    """Loads the baseline state for one scenario run."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def build(self, user_id: uuid.UUID) -> ScenarioContext:
        profile_service = FinancialProfileService(self._session)
        full = await profile_service.get_full_profile(user_id)
        summary = await profile_service.get_summary(user_id)

        ctx = ScenarioContext()
        profile = full.get("profile") or {}

        # ── Income ────────────────────────────────────────────────────
        monthly_income = summary.get("monthly_income") or 0
        if not monthly_income:
            monthly_income = profile.get("monthly_income") or 0
        if monthly_income > 0:
            ctx.monthly_income = Decimal(str(monthly_income))
            ctx.data_available.append("monthly_income")
        else:
            ctx.data_missing.append("monthly_income")

        # ── Expenses ──────────────────────────────────────────────────
        expenses = await self._average_monthly_expenses(user_id)
        estimate_total = (full.get("expenses") or {}).get("monthly_estimate")
        if expenses is not None and expenses > 0:
            ctx.monthly_expenses = Decimal(str(expenses))
            ctx.data_available.append("monthly_expenses")
        elif estimate_total:
            ctx.monthly_expenses = Decimal(str(estimate_total))
            ctx.data_available.append("monthly_expenses")
            ctx.data_available.append("expenses_estimated")
        else:
            ctx.data_missing.append("monthly_expenses")

        ctx.expense_by_category = await self._expense_by_category(
            user_id, full,
        )
        if ctx.expense_by_category:
            ctx.data_available.append("expense_categories")
        else:
            ctx.data_missing.append("expense_categories")

        # ── Budgets ───────────────────────────────────────────────────
        ctx.budgets = await self._budgets(user_id)
        if ctx.budgets:
            ctx.data_available.append("budgets")
        else:
            ctx.data_missing.append("budgets")

        # ── Goals ─────────────────────────────────────────────────────
        ctx.goals = full.get("goals") or []
        if ctx.goals:
            ctx.data_available.append("goals")
        else:
            ctx.data_missing.append("goals")

        # ── Savings / emergency buffer ────────────────────────────────
        savings = full.get("savings") or {}
        if savings.get("asset_count", 0) > 0:
            ctx.cash_savings = Decimal(str(savings.get("total", 0)))
            ctx.emergency_fund = Decimal(str(savings.get("emergency_fund", 0)))
            ctx.data_available.append("savings")
        else:
            ctx.data_missing.append("savings")

        # ── Loans ─────────────────────────────────────────────────────
        ctx.loans = full.get("loans") or []
        ctx.monthly_emi_total = Decimal(
            str(summary.get("monthly_emi_total") or 0)
        )
        if ctx.loans:
            ctx.data_available.append("loans")
        else:
            ctx.data_missing.append("loans")

        # ── Net worth ─────────────────────────────────────────────────
        ctx.total_assets = Decimal(str(summary.get("total_assets") or 0))
        ctx.total_liabilities = Decimal(str(summary.get("total_liabilities") or 0))
        ctx.net_worth = Decimal(str(summary.get("net_worth") or 0))
        ctx.data_available.append("net_worth")

        # ── Profile / retirement inputs ───────────────────────────────
        ctx.current_age = self._age(profile)
        ctx.retirement_age = (
            int(profile["retirement_age"])
            if profile.get("retirement_age") is not None
            else None
        )
        if ctx.current_age is not None:
            ctx.data_available.append("age")
        else:
            ctx.data_missing.append("age")

        return ctx

    # ── Helpers ─────────────────────────────────────────────────────────

    async def _average_monthly_expenses(
        self, user_id: uuid.UUID
    ) -> Decimal | None:
        """Average recorded spend over the last 3 full months."""
        expense_repo = ExpenseRepository(self._session)
        today = date.today()
        year, month = today.year, today.month
        total = Decimal("0")
        months_with_data = 0
        for _ in range(3):
            month -= 1
            if month == 0:
                month = 12
                year -= 1
            start = date(year, month, 1)
            end = (
                date(year + 1, 1, 1)
                if month == 12
                else date(year, month + 1, 1)
            )
            spent = Decimal(
                str(await expense_repo.sum_for_period(user_id, start, end))
            )
            if spent > 0:
                total += spent
                months_with_data += 1
        if months_with_data:
            return total / months_with_data
        return None

    async def _expense_by_category(
        self, user_id: uuid.UUID, full: dict[str, Any]
    ) -> dict[str, Decimal]:
        """Category name → monthly spend (3-month recorded average,
        falling back to the user's stated estimate breakdown)."""
        expense_repo = ExpenseRepository(self._session)
        category_repo = ExpenseCategoryRepository(self._session)
        categories = {c.id: c.name for c in await category_repo.list(limit=1000)}

        today = date.today()
        start_3m = date(
            today.year if today.month > 3 else today.year - 1,
            ((today.month - 4) % 12) + 1,
            1,
        )
        rows = await expense_repo.sum_by_category(user_id, start_3m, today)
        if rows:
            by_cat: dict[str, Decimal] = {}
            for cid, amount in rows:
                name = categories.get(cid)
                if name and amount:
                    by_cat[name.lower()] = Decimal(str(amount)) / 3
            if by_cat:
                return by_cat

        # Fall back to the onboarding estimate breakdown.
        breakdown = (full.get("expenses") or {}).get("breakdown") or []
        by_cat = {}
        for item in breakdown:
            cid = item.get("category_id")
            name = categories.get(uuid.UUID(str(cid))) if cid else None
            amount = item.get("amount") or 0
            if name and amount > 0:
                by_cat[name.lower()] = Decimal(str(amount))
        return by_cat

    async def _budgets(self, user_id: uuid.UUID) -> list[dict[str, Any]]:
        from app.repositories.budgets import BudgetRepository

        repo = BudgetRepository(self._session)
        budgets = await repo.list_for_user(user_id)
        return [
            {
                "id": str(b.id),
                "category_id": str(b.category_id),
                "category_name": b.category.name if b.category else None,
                "monthly_limit": Decimal(str(b.monthly_limit)),
                "period": b.period,
            }
            for b in budgets
        ]

    @staticmethod
    def _age(profile: dict[str, Any]) -> int | None:
        if profile.get("age") is not None:
            return int(profile["age"])
        dob = profile.get("date_of_birth")
        if dob:
            if isinstance(dob, str):
                dob = date.fromisoformat(dob)
            today = date.today()
            return today.year - dob.year - (
                (today.month, today.day) < (dob.month, dob.day)
            )
        return None
