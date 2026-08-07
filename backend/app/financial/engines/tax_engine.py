from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.tax_engine import Deductions, compare_regimes
from app.financial.schemas import TaxAnalysis
from app.repositories.profiles import ProfileRepository


class TaxEngine:
    """Deterministic tax comparison engine."""

    @staticmethod
    async def analyze(
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        deductions: Deductions | None = None,
    ) -> TaxAnalysis:
        profile_repo = ProfileRepository(session)
        profile = await profile_repo.get_by_user_id(user_id)

        gross_income = Decimal(str(profile.monthly_income or 0)) * 12 if profile else Decimal("1000000")
        if gross_income <= 0:
            gross_income = Decimal("1000000")

        deductions = deductions or Deductions()
        result = compare_regimes(gross_income, deductions)

        recommended = "old" if result.old_regime_tax <= result.new_regime_tax else "new"
        chosen = result.old_regime_tax if result.old_regime_tax <= result.new_regime_tax else result.new_regime_tax
        other = result.new_regime_tax if chosen == result.old_regime_tax else result.old_regime_tax

        return TaxAnalysis(
            regime=recommended,
            gross_income=float(gross_income),
            deductions=float(deductions.total_deductions()) if hasattr(deductions, "total_deductions") else 0.0,
            taxable_income=float(gross_income - deductions.total_deductions()) if hasattr(deductions, "total_deductions") and gross_income > deductions.total_deductions() else float(gross_income),
            tax_amount=float(chosen),
            effective_tax_rate=float(chosen / gross_income) if gross_income > 0 else 0,
            savings_vs_other_regime=float(other - chosen),
            recommended_regime=recommended,
            slabs=[],
        )
