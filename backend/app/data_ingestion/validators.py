"""Candidate validation — deterministic rules, no silent correction.

Every extracted value passes through here before becoming a candidate.
Invalid values are flagged INVALID (user must review) — never silently
clamped or corrected.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from app.data_ingestion.types import CandidateStatus

_MAX_MONEY = Decimal("1000000000")        # ₹1B — sanity ceiling
_MAX_RATE = Decimal("100")                # interest rate ceiling
_MAX_TENURE_MONTHS = 600                  # 50 years
_MAX_PAST_DAYS = 365 * 40                 # dates older than 40y are suspect


def validate_scalar(key: str, value: Any) -> tuple[CandidateStatus, str | None]:
    """Validate one normalized value. Returns (status, warning|None)."""
    if value is None:
        return CandidateStatus.INVALID, "Missing value"

    if isinstance(value, (int, float, Decimal)):
        amount = Decimal(str(value))
        if amount < 0:
            return CandidateStatus.INVALID, "Negative values aren't allowed"
        if amount > _MAX_MONEY:
            return CandidateStatus.INVALID, "Value is implausibly large"

        if key == "interest_rate":
            if amount > _MAX_RATE:
                return CandidateStatus.INVALID, "Interest rate is out of range"
            if amount > Decimal("50"):
                return CandidateStatus.WARNING, "Interest rate is unusually high"
        elif key in ("tenure_months", "tenure_remaining_months"):
            if amount > _MAX_TENURE_MONTHS:
                return CandidateStatus.INVALID, "Tenure is out of range"
        elif key == "emi" and amount == 0:
            return CandidateStatus.WARNING, "EMI is zero — please verify"

    if isinstance(value, str) and key.endswith("_date"):
        try:
            parsed = date.fromisoformat(value)
        except ValueError:
            return CandidateStatus.INVALID, "Invalid date"
        if parsed > date.today() + timedelta(days=365 * 30):
            return CandidateStatus.INVALID, "Date is too far in the future"
        if parsed < date.today() - timedelta(days=_MAX_PAST_DAYS):
            return CandidateStatus.WARNING, "Date is unusually old"

    return CandidateStatus.VALID, None


def validate_transaction(payload: dict[str, Any]) -> tuple[CandidateStatus, str | None]:
    """Validate one normalized bank transaction."""
    try:
        amount = Decimal(str(payload.get("amount", "0")))
    except Exception:
        return CandidateStatus.INVALID, "Missing transaction amount"
    if amount <= 0:
        return CandidateStatus.INVALID, "Transaction amount must be positive"
    if amount > _MAX_MONEY:
        return CandidateStatus.INVALID, "Transaction amount is implausible"
    try:
        date.fromisoformat(str(payload.get("date", "")))
    except ValueError:
        return CandidateStatus.INVALID, "Invalid transaction date"
    if payload.get("direction") not in ("DEBIT", "CREDIT"):
        return CandidateStatus.NEEDS_REVIEW, "Transaction direction is unclear"
    if payload.get("txn_class") == "UNKNOWN":
        return CandidateStatus.NEEDS_REVIEW, "Could not classify this transaction"
    return CandidateStatus.VALID, None


def validate_edited_value(kind: str, key: str, value: Any) -> Decimal | str:
    """Validate a user edit before commit — same rules as extraction."""
    if isinstance(value, (int, float)):
        value = Decimal(str(value))
    if isinstance(value, Decimal):
        if value < 0:
            raise ValueError("Value cannot be negative")
        if value > _MAX_MONEY:
            raise ValueError("Value is implausibly large")
        return value
    text = str(value).strip()
    if not text:
        raise ValueError("Value cannot be empty")
    if len(text) > 255:
        raise ValueError("Value is too long")
    return text
