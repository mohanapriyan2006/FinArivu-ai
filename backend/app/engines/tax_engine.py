from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class TaxSlab:
    """A single income tax slab."""

    lower: Decimal
    upper: Decimal | None
    rate: Decimal


OLD_REGIME_SLABS: list[TaxSlab] = [
    TaxSlab(Decimal("0"), Decimal("250000"), Decimal("0")),
    TaxSlab(Decimal("250000"), Decimal("500000"), Decimal("0.05")),
    TaxSlab(Decimal("500000"), Decimal("1000000"), Decimal("0.20")),
    TaxSlab(Decimal("1000000"), None, Decimal("0.30")),
]

NEW_REGIME_SLABS: list[TaxSlab] = [
    TaxSlab(Decimal("0"), Decimal("300000"), Decimal("0")),
    TaxSlab(Decimal("300000"), Decimal("700000"), Decimal("0.05")),
    TaxSlab(Decimal("700000"), Decimal("1000000"), Decimal("0.10")),
    TaxSlab(Decimal("1000000"), Decimal("1200000"), Decimal("0.15")),
    TaxSlab(Decimal("1200000"), Decimal("1500000"), Decimal("0.20")),
    TaxSlab(Decimal("1500000"), None, Decimal("0.30")),
]


@dataclass
class Deductions:
    """Common deductions available under the old tax regime."""

    section_80c: Decimal = Decimal("0")  # max 1,50,000
    section_80ccd_1b: Decimal = Decimal("0")  # max 50,000
    section_80d: Decimal = Decimal("0")
    hra: Decimal = Decimal("0")
    lta: Decimal = Decimal("0")
    section_80e: Decimal = Decimal("0")
    section_80g: Decimal = Decimal("0")
    standard_deduction: Decimal = Decimal("50000")

    def total_old_regime(self) -> Decimal:
        """Return total deductible amount under the old regime."""
        return (
            min(self.section_80c, Decimal("150000"))
            + min(self.section_80ccd_1b, Decimal("50000"))
            + self.section_80d
            + self.hra
            + self.lta
            + self.section_80e
            + self.section_80g
            + self.standard_deduction
        )

    def total_new_regime(self) -> Decimal:
        """Return deductions available under the new regime."""
        # New regime allows only employer NPS contribution (80CCD(2)) and a standard deduction.
        return self.standard_deduction


@dataclass
class TaxCalculation:
    """Tax calculation result."""

    regime: str
    gross_income: Decimal
    deductions_applied: Decimal
    taxable_income: Decimal
    tax_before_cess: Decimal
    cess: Decimal
    total_tax: Decimal
    effective_tax_rate: Decimal
    notes: list[str]


def _calculate_tax_on_income(income: Decimal, slabs: list[TaxSlab]) -> Decimal:
    """Apply progressive tax slabs to the taxable income."""
    tax = Decimal("0")
    remaining = income
    for slab in slabs:
        if remaining <= 0:
            break
        slab_width = (
            (slab.upper - slab.lower)
            if slab.upper is not None
            else remaining
        )
        if slab_width <= 0:
            continue
        taxable_in_slab = min(remaining, slab_width)
        tax += taxable_in_slab * slab.rate
        remaining -= taxable_in_slab
    return tax


def _apply_rebate(tax: Decimal, taxable_income: Decimal, regime: str) -> Decimal:
    """Apply Section 87A rebate for lower income."""
    if regime == "old" and taxable_income <= Decimal("500000"):
        return Decimal("0")
    if regime == "new" and taxable_income <= Decimal("700000"):
        return Decimal("0")
    return tax


def calculate_tax(
    gross_income: Decimal,
    deductions: Deductions | None = None,
    regime: str = "new",
) -> TaxCalculation:
    """Calculate income tax under the specified regime."""
    if regime == "old":
        applicable_deductions = deductions.total_old_regime() if deductions else Decimal("0")
        slabs = OLD_REGIME_SLABS
    else:
        applicable_deductions = deductions.total_new_regime() if deductions else Decimal("50000")
        slabs = NEW_REGIME_SLABS

    taxable_income = gross_income - applicable_deductions
    if taxable_income < 0:
        taxable_income = Decimal("0")

    tax_before_cess = _calculate_tax_on_income(taxable_income, slabs)
    tax_before_cess = _apply_rebate(tax_before_cess, taxable_income, regime)

    cess = tax_before_cess * Decimal("0.04")
    total_tax = tax_before_cess + cess
    effective_rate = total_tax / gross_income if gross_income > 0 else Decimal("0")

    notes = [
        f"Tax computed under the {'old' if regime == 'old' else 'new'} tax regime.",
        f"Taxable income after deductions: ₹{taxable_income:,.2f}.",
        f"4% health and education cess applied.",
    ]

    return TaxCalculation(
        regime=regime,
        gross_income=gross_income,
        deductions_applied=applicable_deductions,
        taxable_income=taxable_income,
        tax_before_cess=tax_before_cess,
        cess=cess,
        total_tax=total_tax,
        effective_tax_rate=effective_rate,
        notes=notes,
    )


def compare_regimes(
    gross_income: Decimal,
    deductions: Deductions,
) -> dict[str, Any]:
    """Return tax payable under both regimes and identify the better option."""
    old = calculate_tax(gross_income, deductions, regime="old")
    new = calculate_tax(gross_income, deductions, regime="new")
    better = "old" if old.total_tax < new.total_tax else "new"

    return {
        "old_regime": old,
        "new_regime": new,
        "better_regime": better,
        "savings": abs(old.total_tax - new.total_tax),
        "recommendation": (
            f"The {better} regime results in lower tax payable."
        ),
    }
