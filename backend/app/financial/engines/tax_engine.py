from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.tax_engine import Deductions, compare_regimes
from app.exceptions import InsufficientDataError
from app.financial.schemas import TaxAnalysis
from app.repositories.profiles import ProfileRepository


class TaxEngine:
    """Deterministic tax comparison engine.

    Wraps ``app.engines.tax_engine.compare_regimes`` — the single source of
    slab/rebate/cess truth — and adapts it to the ``TaxAnalysis`` contract.
    """

    @staticmethod
    async def analyze(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        deductions: Deductions | None = None,
    ) -> TaxAnalysis:
        profile_repo = ProfileRepository(session)
        profile = await profile_repo.get_by_user_id(user_id)

        gross_income = (
            Decimal(str(profile.monthly_income)) * 12
            if profile and profile.monthly_income and profile.monthly_income > 0
            else Decimal("0")
        )
        if gross_income <= 0:
            raise InsufficientDataError(
                "Tax analysis requires income information.",
                missing_fields=["income"],
            )

        deductions = deductions or Deductions()
        result = compare_regimes(gross_income, deductions)

        old = result["old_regime"]
        new = result["new_regime"]
        better: str = result["better_regime"]
        chosen = old if better == "old" else new

        return TaxAnalysis(
            regime=better,
            gross_income=float(gross_income),
            deductions=float(chosen.deductions_applied),
            taxable_income=float(chosen.taxable_income),
            tax_amount=float(chosen.total_tax),
            effective_tax_rate=float(chosen.effective_tax_rate),
            old_regime_tax=float(old.total_tax),
            new_regime_tax=float(new.total_tax),
            better_regime=better,
            savings=float(result["savings"]),
            slabs=[],
        )
