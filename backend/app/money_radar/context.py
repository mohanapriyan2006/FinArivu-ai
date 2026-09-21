"""RadarContext — the canonical data snapshot every detector reads.

Built ONCE per scan by ``RadarContextBuilder`` from the same repositories
and services the rest of the app trusts (``FinancialProfileService`` +
record-level repositories + deterministic engines). Detectors never query
the database directly and never invent missing values — a domain that has
no data is marked ``MISSING`` and its detectors simply do not run.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.money_radar import thresholds as T
from app.money_radar.radar_types import DataAvailability, FreshnessStatus
from app.money_radar.schemas import DataFreshness, DomainCoverage
from app.models.expenses import Expense
from app.repositories.budgets import BudgetRepository
from app.repositories.categories import ExpenseCategoryRepository
from app.repositories.expenses import ExpenseRepository
from app.repositories.income import IncomeRepository
from app.repositories.net_worth_history import NetWorthHistoryRepository
from app.services.financial_profile import FinancialProfileService


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    end = (
        date(year + 1, 1, 1)
        if month == 12
        else date(year, month + 1, 1)
    )
    return start, end


def _freshness(updated_at: datetime | None, now: datetime) -> DataFreshness:
    """Classify a source timestamp into FRESH/RECENT/STALE/UNKNOWN."""
    if updated_at is None:
        return DataFreshness(status=FreshnessStatus.UNKNOWN)
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)
    age_days = max(0, (now - updated_at).days)
    if age_days <= 1:
        status = FreshnessStatus.FRESH
    elif age_days <= T.FRESHNESS_RECENT_DAYS:
        status = FreshnessStatus.RECENT
    else:
        status = FreshnessStatus.STALE
    return DataFreshness(
        updated_at=updated_at,
        age_days=age_days,
        status=status,
    )


def _latest(*timestamps: datetime | None) -> datetime | None:
    known = [t for t in timestamps if t is not None]
    return max(known) if known else None


@dataclass
class MonthWindow:
    """One calendar month of expense data."""

    label: str                    # e.g. "2026-09"
    start: date
    end: date                     # exclusive
    elapsed_ratio: Decimal        # fraction of the month elapsed (current only)
    total: Decimal
    # category_id (str) → spend
    by_category: dict[str, Decimal] = field(default_factory=dict)
    count: int = 0

    @property
    def has_data(self) -> bool:
        return self.count > 0 and self.total > 0


@dataclass
class RadarContext:
    """Everything a detector may read — nothing more."""

    user_id: uuid.UUID
    now: datetime
    today: date

    monthly_income: Decimal | None = None
    income_updated_at: datetime | None = None

    current_month: MonthWindow | None = None
    baseline_months: list[MonthWindow] = field(default_factory=list)
    avg_monthly_expenses: Decimal | None = None      # trailing baseline mean
    monthly_estimate: Decimal | None = None         # user-stated fallback
    expenses_updated_at: datetime | None = None
    recurring_rows: list[Expense] = field(default_factory=list)
    # expense category id (str) → display name, for evidence labels
    category_names: dict[str, str] = field(default_factory=dict)

    budgets: list[dict[str, Any]] = field(default_factory=list)
    budgets_updated_at: datetime | None = None

    goals: list[dict[str, Any]] = field(default_factory=list)
    goals_updated_at: datetime | None = None

    loans: list[dict[str, Any]] = field(default_factory=list)
    credit_cards: list[dict[str, Any]] = field(default_factory=list)
    liabilities_updated_at: datetime | None = None

    savings_total: Decimal | None = None
    emergency_fund: Decimal | None = None
    savings_asset_count: int = 0
    assets_updated_at: datetime | None = None

    tax_profile: dict[str, Any] | None = None
    tax_updated_at: datetime | None = None
    annual_income: Decimal | None = None

    net_worth: Decimal | None = None
    total_assets: Decimal | None = None
    total_liabilities: Decimal | None = None
    net_worth_history: list[dict[str, Any]] = field(default_factory=list)

    data_available: set[str] = field(default_factory=set)
    data_missing: set[str] = field(default_factory=set)
    freshness: dict[str, DataFreshness] = field(default_factory=dict)

    # ── Convenience accessors ────────────────────────────────────────

    @property
    def monthly_surplus(self) -> Decimal | None:
        if self.monthly_income is None or self.avg_monthly_expenses is None:
            return None
        return self.monthly_income - self.avg_monthly_expenses

    def freshness_for(self, domain: str) -> DataFreshness:
        return self.freshness.get(domain, DataFreshness())

    def coverage(self, detector_domains: dict[str, list[str]]) -> list[DomainCoverage]:
        """Per-domain availability rows for the summary surface."""
        rows: list[DomainCoverage] = []
        for domain in sorted(set(self.data_available) | set(self.data_missing)):
            available = domain in self.data_available
            fresh = self.freshness_for(domain)
            availability = (
                DataAvailability.AVAILABLE
                if available and fresh.status != FreshnessStatus.STALE
                else DataAvailability.STALE
                if available
                else DataAvailability.MISSING
            )
            rows.append(
                DomainCoverage(
                    domain=domain,
                    availability=availability,
                    detectors=[
                        dt for dt, doms in detector_domains.items() if domain in doms
                    ],
                    updated_at=fresh.updated_at,
                    freshness=fresh.status,
                )
            )
        return rows


class RadarContextBuilder:
    """Loads the full radar snapshot for one scan — one context, no N+1."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profile_service = FinancialProfileService(session)
        self._expense_repo = ExpenseRepository(session)
        self._income_repo = IncomeRepository(session)
        self._budget_repo = BudgetRepository(session)
        self._category_repo = ExpenseCategoryRepository(session)
        self._networth_repo = NetWorthHistoryRepository(session)

    async def build(self, user_id: uuid.UUID) -> RadarContext:
        now = datetime.now(timezone.utc)
        today = now.date()
        ctx = RadarContext(user_id=user_id, now=now, today=today)

        full = await self._profile_service.get_full_profile(user_id)
        summary = await self._profile_service.get_summary(user_id)
        categories = {c.id: c.name for c in await self._category_repo.list(limit=1000)}
        self._categories = categories
        ctx.category_names = {str(k): v for k, v in categories.items()}

        await self._load_income(ctx, user_id, full, summary)
        await self._load_expenses(ctx, user_id, full)
        await self._load_budgets(ctx, user_id)
        self._load_goals(ctx, full)
        self._load_liabilities(ctx, full)
        await self._load_savings(ctx, user_id, full)
        self._load_tax(ctx, full)
        await self._load_net_worth(ctx, user_id, summary)

        return ctx

    # ── Domain loaders ───────────────────────────────────────────────

    async def _load_income(
        self,
        ctx: RadarContext,
        user_id: uuid.UUID,
        full: dict[str, Any],
        summary: dict[str, Any],
    ) -> None:
        monthly = summary.get("monthly_income") or 0
        profile = full.get("profile") or {}
        if not monthly:
            monthly = profile.get("monthly_income") or 0
        sources = (full.get("income") or {}).get("sources") or []
        ctx.income_updated_at = _latest(
            *[_parse_dt(s.get("updated_at")) for s in sources]
        )
        if monthly and monthly > 0:
            ctx.monthly_income = Decimal(str(monthly))
            ctx.data_available.add("income")
        else:
            ctx.data_missing.add("income")
        ctx.freshness["income"] = _freshness(ctx.income_updated_at, ctx.now)

    async def _load_expenses(
        self,
        ctx: RadarContext,
        user_id: uuid.UUID,
        full: dict[str, Any],
    ) -> None:
        today = ctx.today
        year, month = today.year, today.month

        # Current month-to-date.
        start, next_start = _month_bounds(year, month)
        days_in_month = Decimal((next_start - start).days)
        elapsed = Decimal((today - start).days + 1) / days_in_month
        current_rows = await self._expense_repo.list_for_user(
            user_id, start_date=start, end_date=today, limit=1000
        )
        current_by_cat = await self._sum_by_category(user_id, start, today)
        ctx.current_month = MonthWindow(
            label=f"{year:04d}-{month:02d}",
            start=start,
            end=next_start,
            elapsed_ratio=elapsed,
            total=sum(current_by_cat.values(), Decimal("0")),
            by_category=current_by_cat,
            count=len(current_rows),
        )

        # Trailing complete months for baseline comparisons.
        baseline: list[MonthWindow] = []
        for _ in range(T.SPENDING_SPIKE_BASELINE_MONTHS):
            month -= 1
            if month == 0:
                month = 12
                year -= 1
            m_start, m_end = _month_bounds(year, month)
            m_last = m_end - timedelta(days=1)
            rows = await self._expense_repo.list_for_user(
                user_id,
                start_date=m_start,
                end_date=m_last,
                limit=1000,
            )
            by_cat = await self._sum_by_category(user_id, m_start, m_last)
            baseline.append(
                MonthWindow(
                    label=f"{year:04d}-{month:02d}",
                    start=m_start,
                    end=m_end,
                    elapsed_ratio=Decimal("1"),
                    total=sum(by_cat.values(), Decimal("0")),
                    by_category=by_cat,
                    count=len(rows),
                )
            )
        ctx.baseline_months = [m for m in baseline if m.has_data]

        populated = [m.total for m in ctx.baseline_months]
        if populated:
            ctx.avg_monthly_expenses = sum(populated, Decimal("0")) / Decimal(
                len(populated)
            )
            ctx.data_available.add("expenses")
        else:
            ctx.data_missing.add("expenses")

        estimate = (full.get("expenses") or {}).get("monthly_estimate")
        if estimate:
            ctx.monthly_estimate = Decimal(str(estimate))
            ctx.data_available.add("expense_estimates")
        else:
            ctx.data_missing.add("expense_estimates")

        # Rows for recurring-cost detection (last N days — also covers the
        # baseline months, so it supplies the domain freshness timestamp).
        window_start = date.fromordinal(
            today.toordinal() - T.RECURRING_WINDOW_DAYS
        )
        ctx.recurring_rows = list(
            await self._expense_repo.list_for_user(
                user_id, start_date=window_start, end_date=today, limit=500
            )
        )

        ctx.expenses_updated_at = _latest(
            *[_parse_dt(getattr(r, "updated_at", None)) for r in current_rows],
            *[_parse_dt(getattr(r, "updated_at", None)) for r in ctx.recurring_rows],
        )
        ctx.freshness["expenses"] = _freshness(ctx.expenses_updated_at, ctx.now)

    async def _sum_by_category(
        self, user_id: uuid.UUID, start: date, end: date
    ) -> dict[str, Decimal]:
        rows = await self._expense_repo.sum_by_category(user_id, start, end)
        out: dict[str, Decimal] = {}
        for cid, amount in rows:
            if cid is None or not amount:
                continue
            name = self._categories.get(cid)
            if name:
                out[str(cid)] = Decimal(str(amount))
        return out

    async def _load_budgets(self, ctx: RadarContext, user_id: uuid.UUID) -> None:
        budgets = await self._budget_repo.list_for_user(user_id, limit=1000)
        ctx.budgets = [
            {
                "id": str(b.id),
                "category_id": str(b.category_id),
                "category_name": (
                    b.category.name if b.category else self._categories.get(b.category_id)
                ),
                "monthly_limit": Decimal(str(b.monthly_limit)),
                "period": b.period,
                "updated_at": _parse_dt(getattr(b, "updated_at", None)),
            }
            for b in budgets
        ]
        ctx.budgets_updated_at = _latest(
            *[b["updated_at"] for b in ctx.budgets]
        )
        if ctx.budgets:
            ctx.data_available.add("budgets")
        else:
            ctx.data_missing.add("budgets")
        ctx.freshness["budgets"] = _freshness(ctx.budgets_updated_at, ctx.now)

    def _load_goals(self, ctx: RadarContext, full: dict[str, Any]) -> None:
        goals = [
            g for g in (full.get("goals") or []) if g.get("status") == "Active"
        ]
        ctx.goals = goals
        ctx.goals_updated_at = _latest(
            *[_parse_dt(g.get("updated_at")) for g in goals]
        )
        if ctx.goals:
            ctx.data_available.add("goals")
        else:
            ctx.data_missing.add("goals")
        ctx.freshness["goals"] = _freshness(ctx.goals_updated_at, ctx.now)

    def _load_liabilities(self, ctx: RadarContext, full: dict[str, Any]) -> None:
        ctx.loans = full.get("loans") or []
        ctx.credit_cards = full.get("credit_cards") or []
        ctx.liabilities_updated_at = _latest(
            *[_parse_dt(l.get("updated_at")) for l in ctx.loans],
            *[_parse_dt(c.get("updated_at")) for c in ctx.credit_cards],
        )
        if ctx.loans or ctx.credit_cards:
            ctx.data_available.add("liabilities")
        else:
            ctx.data_missing.add("liabilities")
        ctx.freshness["liabilities"] = _freshness(
            ctx.liabilities_updated_at, ctx.now
        )

    async def _load_savings(
        self, ctx: RadarContext, user_id: uuid.UUID, full: dict[str, Any]
    ) -> None:
        from app.repositories.assets import AssetRepository

        savings = full.get("savings") or {}
        ctx.savings_asset_count = int(savings.get("asset_count") or 0)
        if ctx.savings_asset_count > 0:
            ctx.savings_total = Decimal(str(savings.get("total") or 0))
            ctx.emergency_fund = Decimal(str(savings.get("emergency_fund") or 0))
            ctx.data_available.add("savings")
        else:
            ctx.data_missing.add("savings")
        # Freshness comes from the actual asset rows (cash/bank savings live
        # in the assets table; the profile summary carries no timestamps).
        asset_rows = await AssetRepository(self._session).list_for_user(
            user_id, limit=1000
        )
        ctx.assets_updated_at = _latest(
            *[_parse_dt(getattr(a, "updated_at", None)) for a in asset_rows]
        )
        ctx.freshness["savings"] = _freshness(ctx.assets_updated_at, ctx.now)

    def _load_tax(self, ctx: RadarContext, full: dict[str, Any]) -> None:
        tax = full.get("tax_profile")
        ctx.tax_profile = tax if tax else None
        ctx.tax_updated_at = (
            _parse_dt(tax.get("updated_at")) if tax else None
        )
        if tax:
            ctx.data_available.add("tax")
        else:
            ctx.data_missing.add("tax")
        ctx.freshness["tax"] = _freshness(ctx.tax_updated_at, ctx.now)

        annual = (tax or {}).get("annual_income")
        if annual and float(annual) > 0:
            ctx.annual_income = Decimal(str(annual))
        elif ctx.monthly_income and ctx.monthly_income > 0:
            ctx.annual_income = ctx.monthly_income * 12

    async def _load_net_worth(
        self,
        ctx: RadarContext,
        user_id: uuid.UUID,
        summary: dict[str, Any],
    ) -> None:
        total_assets = Decimal(str(summary.get("total_assets") or 0))
        total_liabilities = Decimal(str(summary.get("total_liabilities") or 0))
        has_balance_sheet = bool(
            ctx.data_available & {"savings"}
            or summary.get("total_assets")
            or summary.get("total_liabilities")
        )
        if has_balance_sheet:
            ctx.total_assets = total_assets
            ctx.total_liabilities = total_liabilities
            ctx.net_worth = total_assets - total_liabilities
            ctx.data_available.add("net_worth")

            # Persist today's snapshot so the change detector has real
            # history to compare against on future scans.
            await self._networth_repo.upsert_snapshot(
                user_id,
                ctx.today,
                ctx.net_worth,
                total_assets,
                total_liabilities,
            )
            history = await self._networth_repo.list_for_user(user_id, limit=24)
            ctx.net_worth_history = [
                {
                    "snapshot_date": h.snapshot_date,
                    "net_worth": Decimal(str(h.net_worth)),
                    "total_assets": Decimal(str(h.total_assets or 0)),
                    "total_liabilities": Decimal(str(h.total_liabilities or 0)),
                }
                for h in history
            ]
            if len(ctx.net_worth_history) >= 2:
                ctx.data_available.add("net_worth_history")
            else:
                ctx.data_missing.add("net_worth_history")
        else:
            ctx.data_missing.add("net_worth")
            ctx.data_missing.add("net_worth_history")
        ctx.freshness["net_worth"] = _freshness(
            _latest(ctx.assets_updated_at, ctx.liabilities_updated_at), ctx.now
        )


def _parse_dt(value: Any) -> datetime | None:
    """Normalise a model timestamp (datetime or ISO string) to aware UTC."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return None
