from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assets import Asset
from app.models.expense_estimates import MonthlyExpenseEstimate
from app.models.goals import Goal
from app.models.income import Income
from app.models.insurance import Insurance
from app.models.liabilities import Liability
from app.models.profiles import Profile
from app.models.tax_profiles import TaxProfile
from app.repositories.assets import AssetRepository
from app.repositories.expense_estimates import MonthlyExpenseEstimateRepository
from app.repositories.goals import GoalRepository
from app.repositories.income import IncomeRepository
from app.repositories.insurance import InsuranceRepository
from app.repositories.liabilities import LiabilityRepository
from app.repositories.profiles import ProfileRepository
from app.repositories.tax_profiles import TaxProfileRepository
from app.schemas.financial_profile import (
    AboutYouUpdate,
    CreditCardUpdate,
    ExpenseProfileUpdate,
    FixedDepositUpdate,
    GoalUpdate,
    IncomeProfileUpdate,
    InsuranceUpdate,
    InvestmentUpdate,
    LoanUpdate,
    ProfileCompletionResponse,
    SavingsUpdate,
    SectionStatus,
    TaxProfileUpdate,
)
from app.services.profiles import ProfileService


SECTION_WEIGHTS: dict[str, int] = {
    "aboutYou": 10,
    "income": 15,
    "expenses": 20,
    "savings": 15,
    "investments": 15,
    "loans": 10,
    "goals": 15,
}

OPTIONAL_SECTIONS: set[str] = {
    "fixedDeposits",
    "creditCards",
    "insurance",
    "taxProfile",
}

CORE_SECTIONS: set[str] = {
    "aboutYou",
    "income",
    "expenses",
    "savings",
    "investments",
    "loans",
    "goals",
}


class FinancialProfileService:
    """Service for onboarding, updating, and retrieving a user's financial profile."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profile_repo = ProfileRepository(session)
        self._profile_service = ProfileService(session)
        self._income_repo = IncomeRepository(session)
        self._expense_estimate_repo = MonthlyExpenseEstimateRepository(session)
        self._asset_repo = AssetRepository(session)
        self._liability_repo = LiabilityRepository(session)
        self._goal_repo = GoalRepository(session)
        self._insurance_repo = InsuranceRepository(session)
        self._tax_repo = TaxProfileRepository(session)

    async def update_section(
        self,
        user_id: uuid.UUID,
        section: str,
        payload: Any,
    ) -> dict[str, Any]:
        """Dispatch to the correct section handler and return a summary."""
        handler = getattr(self, f"_update_{section}", None)
        if handler is None:
            raise ValueError(f"Unknown section: {section}")
        return await handler(user_id, payload)

    async def _update_aboutYou(
        self,
        user_id: uuid.UUID,
        data: AboutYouUpdate,
    ) -> dict[str, Any]:
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        if "age" in update_dict:
            update_dict["age"] = update_dict["age"]
        update_dict["profile_initialized"] = True
        await self._profile_service.update_by_user(user_id, data)
        return {"section": "aboutYou", "status": "saved"}

    async def _update_income(
        self,
        user_id: uuid.UUID,
        data: IncomeProfileUpdate,
    ) -> dict[str, Any]:
        existing = await self._income_repo.get_primary_by_user(user_id)
        payload = data.model_dump(by_alias=False)
        payload["user_id"] = user_id
        if existing:
            await self._income_repo.update(existing.id, payload)
        else:
            self._session.add(Income(**payload))
            await self._session.flush()
        return {
            "section": "income",
            "status": "saved",
            "monthly_income": float(payload["amount"]),
        }

    async def _update_expenses(
        self,
        user_id: uuid.UUID,
        data: ExpenseProfileUpdate,
    ) -> dict[str, Any]:
        month = data.estimate_month
        existing = await self._expense_estimate_repo.list_for_user(user_id, month)
        for record in existing:
            record.soft_delete()

        total = MonthlyExpenseEstimate(
            user_id=user_id,
            amount=data.total_amount,
            source=data.source,
            estimate_month=month,
            category_id=None,
        )
        self._session.add(total)

        for item in data.breakdown:
            if item.amount <= 0:
                continue
            estimate = MonthlyExpenseEstimate(
                user_id=user_id,
                category_id=item.category_id,
                amount=item.amount,
                source=data.source,
                estimate_month=month,
            )
            self._session.add(estimate)

        await self._session.flush()
        return {
            "section": "expenses",
            "status": "saved",
            "total": float(data.total_amount),
        }

    async def _update_savings(
        self,
        user_id: uuid.UUID,
        data: SavingsUpdate,
    ) -> dict[str, Any]:
        buckets = {
            "emergency": data.emergency_fund,
            "general": data.general_savings,
            "goal": data.goal_savings,
        }
        for bucket, amount in buckets.items():
            if amount is None:
                continue
            existing = await self._asset_repo.list_by_savings_bucket(user_id, bucket)
            for record in existing:
                record.soft_delete()
            if amount > 0:
                asset = Asset(
                    user_id=user_id,
                    asset_type="Cash",
                    name=f"{bucket.capitalize()} Savings",
                    value=amount,
                    savings_bucket=bucket,
                    is_emergency_fund=(bucket == "emergency"),
                    source="manual",
                )
                self._session.add(asset)

        await self._session.flush()
        return {
            "section": "savings",
            "status": "saved",
            "total": float(sum(v for v in buckets.values() if v is not None)),
        }

    async def _update_investments(
        self,
        user_id: uuid.UUID,
        data: InvestmentUpdate,
    ) -> dict[str, Any]:
        await self._asset_repo.soft_delete_by_user_and_type(user_id, "Cash")
        for item in data.items:
            asset = Asset(
                user_id=user_id,
                asset_type=item.asset_type,
                name=item.name,
                value=item.value,
                description=item.description,
                source="manual",
            )
            self._session.add(asset)
        await self._session.flush()
        return {
            "section": "investments",
            "status": "saved",
            "total": float(sum(item.value for item in data.items)),
        }

    async def _update_fixedDeposits(
        self,
        user_id: uuid.UUID,
        data: FixedDepositUpdate,
    ) -> dict[str, Any]:
        await self._asset_repo.soft_delete_by_user_and_type(
            user_id, "Fixed Deposit"
        )
        for item in data.items:
            asset = Asset(
                user_id=user_id,
                asset_type="Fixed Deposit",
                name=item.name,
                value=item.value,
                interest_rate=item.interest_rate,
                maturity_date=item.maturity_date,
                description=item.description,
                source="manual",
            )
            self._session.add(asset)
        await self._session.flush()
        return {
            "section": "fixedDeposits",
            "status": "saved",
            "total": float(sum(item.value for item in data.items)),
        }

    async def _update_loans(
        self,
        user_id: uuid.UUID,
        data: LoanUpdate,
    ) -> dict[str, Any]:
        existing = await self._liability_repo.list_for_user(user_id)
        for record in existing:
            if record.liability_type != "Credit Card":
                record.soft_delete()

        for item in data.items:
            liability = Liability(
                user_id=user_id,
                liability_type=item.liability_type,
                name=item.name,
                amount=item.outstanding_amount,
                emi=item.monthly_emi,
                interest_rate=item.interest_rate,
                remaining_tenure_months=item.remaining_months,
                start_date=item.start_date,
                source="manual",
            )
            self._session.add(liability)
        await self._session.flush()
        return {
            "section": "loans",
            "status": "saved",
            "total": float(sum(item.outstanding_amount for item in data.items)),
        }

    async def _update_creditCards(
        self,
        user_id: uuid.UUID,
        data: CreditCardUpdate,
    ) -> dict[str, Any]:
        existing = await self._liability_repo.list_for_user(
            user_id, liability_type="Credit Card"
        )
        for record in existing:
            record.soft_delete()

        liability = Liability(
            user_id=user_id,
            liability_type="Credit Card",
            name="Credit Card",
            amount=data.current_outstanding,
            emi=data.typical_monthly_payment,
            credit_limit=data.credit_limit,
            monthly_spend=data.monthly_spend,
            source="manual",
        )
        self._session.add(liability)
        await self._session.flush()
        return {
            "section": "creditCards",
            "status": "saved",
            "outstanding": float(data.current_outstanding),
        }

    async def _update_goals(
        self,
        user_id: uuid.UUID,
        data: GoalUpdate,
    ) -> dict[str, Any]:
        existing = await self._goal_repo.list_for_user(user_id)
        for record in existing:
            record.soft_delete()

        for item in data.items:
            goal = Goal(
                user_id=user_id,
                goal_name=item.goal_name,
                target_amount=item.target_amount,
                current_amount=item.current_amount,
                target_date=item.target_date,
                priority=item.priority,
                status="Active",
            )
            self._session.add(goal)
        await self._session.flush()
        return {
            "section": "goals",
            "status": "saved",
            "count": len(data.items),
        }

    async def _update_insurance(
        self,
        user_id: uuid.UUID,
        data: InsuranceUpdate,
    ) -> dict[str, Any]:
        existing = await self._insurance_repo.list_for_user(user_id)
        for record in existing:
            record.soft_delete()

        for item in data.items:
            policy = Insurance(
                user_id=user_id,
                insurance_type=item.insurance_type,
                coverage_amount=item.coverage_amount,
                annual_premium=item.annual_premium,
            )
            self._session.add(policy)
        await self._session.flush()
        return {
            "section": "insurance",
            "status": "saved",
            "count": len(data.items),
        }

    async def _update_taxProfile(
        self,
        user_id: uuid.UUID,
        data: TaxProfileUpdate,
    ) -> dict[str, Any]:
        existing = await self._tax_repo.get_by_user_id(user_id)
        payload = data.model_dump(
            exclude_unset=True, exclude_none=True, by_alias=False
        )
        if existing:
            await self._tax_repo.update(existing.id, payload)
        else:
            payload["user_id"] = user_id
            self._session.add(TaxProfile(**payload))
            await self._session.flush()
        return {"section": "taxProfile", "status": "saved"}

    async def get_full_profile(self, user_id: uuid.UUID) -> dict[str, Any]:
        """Return the aggregated financial profile for a user."""
        profile = await self._profile_repo.get_by_user_id(user_id)
        income = await self._income_repo.list_for_user(user_id)
        estimates = await self._expense_estimate_repo.list_for_user(user_id)
        assets = await self._asset_repo.list_for_user(user_id)
        liabilities = await self._liability_repo.list_for_user(user_id)
        goals = await self._goal_repo.list_for_user(user_id)
        insurance = await self._insurance_repo.list_for_user(user_id)
        tax = await self._tax_repo.get_by_user_id(user_id)

        cash_assets = [a for a in assets if a.asset_type == "Cash"]
        investment_assets = [
            a for a in assets if a.asset_type not in {"Cash", "Fixed Deposit"}
        ]
        fixed_deposits = [a for a in assets if a.asset_type == "Fixed Deposit"]
        loans = [l for l in liabilities if l.liability_type != "Credit Card"]
        cards = [l for l in liabilities if l.liability_type == "Credit Card"]

        completion = await self.get_completion(user_id)

        return {
            "profile": self._profile_to_dict(profile),
            "income": {
                "monthly_take_home": float(income[0].amount) if income else None,
                "sources": [self._as_dict(i) for i in income],
            },
            "expenses": {
                "monthly_estimate": float(estimates[0].amount)
                if estimates and estimates[0].category_id is None
                else None,
                "breakdown": [
                    self._as_dict(e)
                    for e in estimates
                    if e.category_id is not None
                ],
            },
            "savings": self._savings_summary(cash_assets),
            "investments": [self._as_dict(a) for a in investment_assets],
            "fixed_deposits": [self._as_dict(a) for a in fixed_deposits],
            "loans": [self._as_dict(l) for l in loans],
            "credit_cards": [self._as_dict(l) for l in cards],
            "goals": [self._as_dict(g) for g in goals],
            "insurance": [self._as_dict(i) for i in insurance],
            "tax_profile": self._as_dict(tax) if tax else None,
            "completion": completion,
        }

    async def get_completion(
        self,
        user_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Calculate backend completion from real records."""
        statuses: list[SectionStatus] = []
        completed_weight = 0
        total_weight = 0

        profile = await self._profile_repo.get_by_user_id(user_id)
        about_complete = (
            profile is not None
            and profile.age is not None
            and profile.employment_type is not None
            and profile.city is not None
        )

        income = await self._income_repo.list_for_user(user_id)
        income_complete = bool(income)

        estimates = await self._expense_estimate_repo.list_for_user(user_id)
        expense_complete = bool(estimates)

        assets = await self._asset_repo.list_for_user(user_id)
        savings_complete = any(
            a.asset_type == "Cash" and a.savings_bucket is not None
            for a in assets
        )
        investment_complete = any(
            a.asset_type not in {"Cash", "Fixed Deposit"} for a in assets
        )

        liabilities = await self._liability_repo.list_for_user(user_id)
        loan_complete = any(l.liability_type != "Credit Card" for l in liabilities)

        goals = await self._goal_repo.list_for_user(user_id)
        goal_complete = bool(goals)

        section_states: dict[str, bool] = {
            "aboutYou": about_complete,
            "income": income_complete,
            "expenses": expense_complete,
            "savings": savings_complete,
            "investments": investment_complete,
            "loans": loan_complete,
            "goals": goal_complete,
        }

        for section, weight in SECTION_WEIGHTS.items():
            complete = section_states.get(section, False)
            statuses.append(
                SectionStatus(section=section, complete=complete, weight=weight)
            )
            total_weight += weight
            if complete:
                completed_weight += weight

        optional_states: dict[str, bool] = {
            "fixedDeposits": any(
                a.asset_type == "Fixed Deposit" for a in assets
            ),
            "creditCards": any(
                l.lability_type == "Credit Card" for l in liabilities
            ),
            "insurance": bool(
                await self._insurance_repo.list_for_user(user_id)
            ),
            "taxProfile": bool(
                await self._tax_repo.get_by_user_id(user_id)
            ),
        }

        for section, complete in optional_states.items():
            statuses.append(
                SectionStatus(section=section, complete=complete, weight=0)
            )

        missing = [s.section for s in statuses if not s.complete and s.weight > 0]
        last_incomplete: str | None = None
        for section in list(SECTION_WEIGHTS.keys()):
            if not section_states.get(section, False):
                last_incomplete = section
                break

        percentage = int((completed_weight / total_weight) * 100) if total_weight else 0
        core_ready = all(section_states.get(s, False) for s in CORE_SECTIONS)

        return {
            "completion_percentage": percentage,
            "core_ready": core_ready,
            "missing_sections": missing,
            "last_incomplete_section": last_incomplete,
            "section_status": [s.model_dump() for s in statuses],
        }

    async def get_summary(self, user_id: uuid.UUID) -> dict[str, Any]:
        """Return a high-level financial summary for a user."""
        income = await self._income_repo.list_for_user(user_id)
        assets = await self._asset_repo.list_for_user(user_id)
        liabilities = await self._liability_repo.list_for_user(user_id)
        goals = await self._goal_repo.list_for_user(user_id)

        monthly_income = sum((i.amount for i in income), Decimal("0"))
        total_assets = sum((a.value for a in assets), Decimal("0"))
        total_liabilities = sum((l.amount for l in liabilities), Decimal("0"))
        total_emi = sum(
            (l.emi or Decimal("0") for l in liabilities if l.liability_type != "Credit Card"),
            Decimal("0"),
        )
        credit_outstanding = sum(
            (l.amount for l in liabilities if l.liability_type == "Credit Card"),
            Decimal("0"),
        )

        return {
            "monthly_income": float(monthly_income),
            "total_assets": float(total_assets),
            "total_liabilities": float(total_liabilities),
            "net_worth": float(total_assets - total_liabilities),
            "monthly_emi_total": float(total_emi),
            "credit_card_outstanding": float(credit_outstanding),
            "goal_count": len(goals),
        }

    @staticmethod
    def _profile_to_dict(profile: Profile | None) -> dict[str, Any] | None:
        if profile is None:
            return None
        return {
            "full_name": profile.full_name,
            "age": profile.age,
            "employment_type": profile.employment_type,
            "city": profile.city,
            "dependents": profile.dependents,
            "children_count": profile.children_count,
            "monthly_income": float(profile.monthly_income)
            if profile.monthly_income is not None
            else None,
            "retirement_age": profile.retirement_age,
            "risk_profile": profile.risk_profile,
            "investment_experience": profile.investment_experience,
            "profile_initialized": profile.profile_initialized,
            "completed_at": profile.completed_at.isoformat()
            if profile.completed_at
            else None,
        }

    @staticmethod
    def _savings_summary(assets: list[Asset]) -> dict[str, Any]:
        totals: dict[str, Decimal] = {
            "emergency": Decimal("0"),
            "general": Decimal("0"),
            "goal": Decimal("0"),
        }
        for asset in assets:
            bucket = asset.savings_bucket or "general"
            totals[bucket] = totals.get(bucket, Decimal("0")) + asset.value
        return {
            "emergency_fund": float(totals["emergency"]),
            "general_savings": float(totals["general"]),
            "goal_savings": float(totals["goal"]),
            "total": float(sum(totals.values(), Decimal("0"))),
        }

    @staticmethod
    def _as_dict(obj: Any) -> dict[str, Any]:
        if obj is None:
            return {}
        data = {}
        for key, value in vars(obj).items():
            if key.startswith("_"):
                continue
            if key in ("id", "user_id") and isinstance(value, uuid.UUID):
                value = str(value)
            if isinstance(value, Decimal):
                value = float(value)
            data[key] = value
        return data
