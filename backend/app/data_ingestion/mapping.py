"""NormalizedImport → ImportCandidate specs (the domain-mapping layer).

This is where document semantics meet FinArivu models: it loads the
user's current values, decides UPDATE vs CREATE, runs validation, and
fingerprints records for dedup. Extractors stay document-literal; this
layer owns domain meaning.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data_ingestion.extractors.investment_statement import (
    map_holding_type_to_asset,
)
from app.data_ingestion.fingerprints import (
    description_similarity,
    transaction_fingerprint,
)
from app.data_ingestion.normalized import NormalizedImport, NormalizedRecord
from app.data_ingestion.types import (
    CandidateDecision,
    CandidateKind,
    CandidateOperation,
    CandidateStatus,
    DocumentType,
    TransactionClass,
)
from app.data_ingestion.validators import validate_scalar, validate_transaction
from app.models.assets import Asset
from app.models.expenses import Expense
from app.models.income import Income
from app.models.liabilities import Liability
from app.models.tax_profiles import TaxProfile
from app.repositories.categories import ExpenseCategoryRepository
from app.repositories.income import IncomeRepository


@dataclass
class CandidateSpec:
    """Pre-persistence candidate — the service stamps batch_id/seq."""

    kind: CandidateKind
    target_domain: str
    target_entity: str
    operation: CandidateOperation
    label: str
    field_name: str | None = None
    current_value: Any = None
    proposed_value: Any = None
    proposed_payload: dict[str, Any] = field(default_factory=dict)
    matched_entity_id: uuid.UUID | None = None
    validation_state: CandidateStatus = CandidateStatus.VALID
    confidence: str = "MEDIUM"
    decision: CandidateDecision = CandidateDecision.ACCEPTED
    fingerprint: str | None = None
    provenance: dict[str, Any] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


# ── Shared helpers ─────────────────────────────────────────────────────────


def _norm_name(text: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9 ]", " ", (text or "").lower()).split())


def _field_map(normalized: NormalizedImport) -> dict[str, Any]:
    return {f.key: f for f in normalized.fields}


def _field_candidate(
    *,
    key: str,
    label: str,
    target_domain: str,
    target_entity: str,
    proposed: Any,
    current: Any,
    matched_id: uuid.UUID | None,
    operation: CandidateOperation,
    confidence: str,
    provenance: dict[str, Any],
    extra_warnings: list[str] | None = None,
    payload: dict[str, Any] | None = None,
) -> CandidateSpec:
    status, warning = validate_scalar(key, proposed)
    warnings = [w for w in ([warning] + (extra_warnings or [])) if w]
    if current is not None and proposed is not None:
        try:
            if Decimal(str(current)) == Decimal(str(proposed)):
                warnings.append("Same as the current value")
                status = CandidateStatus.WARNING
        except Exception:
            pass
    decision = (
        CandidateDecision.ACCEPTED
        if status in (CandidateStatus.VALID, CandidateStatus.WARNING)
        else CandidateDecision.SKIPPED
    )
    return CandidateSpec(
        kind=CandidateKind.FIELD,
        target_domain=target_domain,
        target_entity=target_entity,
        operation=operation,
        field_name=key,
        label=label,
        current_value=current,
        proposed_value=proposed,
        proposed_payload=payload or {},
        matched_entity_id=matched_id,
        validation_state=status,
        confidence=confidence,
        decision=decision,
        provenance=provenance,
        warnings=warnings,
    )


# ── Payslip ────────────────────────────────────────────────────────────────


async def _map_payslip(
    session: AsyncSession,
    user_id: uuid.UUID,
    normalized: NormalizedImport,
) -> list[CandidateSpec]:
    specs: list[CandidateSpec] = []
    fields = _field_map(normalized)

    income_repo = IncomeRepository(session)
    primary = await income_repo.get_primary_by_user(user_id)

    # net pay → primary monthly income (Income.amount).
    net = fields.get("net_pay") or fields.get("gross_income")
    if net is not None:
        specs.append(
            _field_candidate(
                key="amount",
                label="Monthly income",
                target_domain="income",
                target_entity="primary_income",
                proposed=str(net.value),
                current=str(primary.amount) if primary else None,
                matched_id=primary.id if primary else None,
                operation=CandidateOperation.UPDATE if primary else CandidateOperation.CREATE,
                confidence=net.confidence.value,
                provenance=net.provenance.to_dict(),
                payload={"source": "Salary", "is_primary": True, "is_recurring": True},
            )
        )

    # gross × 12 → TaxProfile.annual_income (documented annualisation rule).
    gross = fields.get("gross_income")
    if gross is not None:
        tax_row = (
            await session.execute(
                select(TaxProfile).where(
                    TaxProfile.user_id == user_id,
                    TaxProfile.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        annual = Decimal(str(gross.value)) * 12
        specs.append(
            _field_candidate(
                key="annual_income",
                label="Annual income (tax profile)",
                target_domain="tax",
                target_entity="tax_profile",
                proposed=str(annual),
                current=str(tax_row.annual_income)
                if tax_row and tax_row.annual_income is not None
                else None,
                matched_id=tax_row.id if tax_row else None,
                operation=CandidateOperation.UPDATE if tax_row else CandidateOperation.CREATE,
                confidence="MEDIUM",
                provenance=gross.provenance.to_dict(),
                extra_warnings=["Estimated as monthly gross × 12"],
            )
        )

    # epf × 12 → TaxProfile.deduction_80c (EPF is 80C-eligible; flagged
    # as an estimate — the user can skip if 80C covers more).
    epf = fields.get("epf")
    if epf is not None:
        tax_row = (
            await session.execute(
                select(TaxProfile).where(
                    TaxProfile.user_id == user_id,
                    TaxProfile.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        annual_epf = Decimal(str(epf.value)) * 12
        specs.append(
            _field_candidate(
                key="deduction_80c",
                label="80C deduction (EPF × 12)",
                target_domain="tax",
                target_entity="tax_profile",
                proposed=str(annual_epf),
                current=str(tax_row.deduction_80c)
                if tax_row and tax_row.deduction_80c is not None
                else None,
                matched_id=tax_row.id if tax_row else None,
                operation=CandidateOperation.UPDATE if tax_row else CandidateOperation.CREATE,
                confidence="LOW",
                provenance=epf.provenance.to_dict(),
                extra_warnings=[
                    "Estimated annual EPF contribution — may be part of a "
                    "larger 80C total"
                ],
            )
        )
    return specs


# ── Loan statement ─────────────────────────────────────────────────────────

_LOAN_FIELD_MAP = {
    "principal_outstanding": ("amount", "Outstanding"),
    "emi": ("emi", "EMI"),
    "interest_rate": ("interest_rate", "Interest rate"),
    "tenure_remaining_months": ("remaining_tenure_months", "Remaining tenure"),
    "maturity_date": ("end_date", "Maturity date"),
    "start_date": ("start_date", "Start date"),
}


async def _map_loan(
    session: AsyncSession,
    user_id: uuid.UUID,
    normalized: NormalizedImport,
) -> list[CandidateSpec]:
    specs: list[CandidateSpec] = []
    fields = _field_map(normalized)

    liabilities = list(
        (
            await session.execute(
                select(Liability).where(
                    Liability.user_id == user_id,
                    Liability.deleted_at.is_(None),
                    Liability.liability_type != "Credit Card",
                )
            )
        ).scalars().all()
    )

    # Deterministic match: name contains lender/account tokens, else the
    # single non-credit-card liability, else CREATE.
    matched: Liability | None = None
    lender = _norm_name(str(fields.get("lender").value)) if fields.get("lender") else ""
    loan_type = normalized.meta.get("loan_type", "")
    if lender:
        for li in liabilities:
            if lender and lender in _norm_name(li.name):
                matched = li
                break
    if matched is None:
        typed = [li for li in liabilities if not loan_type or li.liability_type == loan_type]
        if len(typed) == 1:
            matched = typed[0]

    if matched is not None:
        current = {
            "amount": matched.amount,
            "emi": matched.emi,
            "interest_rate": matched.interest_rate,
            "remaining_tenure_months": matched.remaining_tenure_months,
            "end_date": matched.end_date.isoformat() if matched.end_date else None,
            "start_date": matched.start_date.isoformat() if matched.start_date else None,
        }
        for key, (column, label) in _LOAN_FIELD_MAP.items():
            f = fields.get(key)
            if f is None:
                continue
            cur = current.get(column)
            specs.append(
                _field_candidate(
                    key=column,
                    label=f"{label} ({matched.name})",
                    target_domain="liability",
                    target_entity=f"liability:{matched.id}",
                    proposed=f.value,
                    current=str(cur) if cur is not None else None,
                    matched_id=matched.id,
                    operation=CandidateOperation.UPDATE,
                    confidence=f.confidence.value,
                    provenance=f.provenance.to_dict(),
                    payload={"liability_id": str(matched.id), "column": column},
                )
            )
    else:
        # Whole-entity CREATE — needs at least outstanding + a name.
        outstanding = fields.get("principal_outstanding")
        name = (
            str(fields["lender"].value) if fields.get("lender") else ""
        ) or loan_type or "Imported loan"
        if outstanding is not None:
            payload = {
                "liability_type": loan_type or "Other",
                "name": name,
                "amount": outstanding.value,
                "emi": fields["emi"].value if fields.get("emi") else None,
                "interest_rate": fields["interest_rate"].value
                if fields.get("interest_rate")
                else None,
                "remaining_tenure_months": int(Decimal(str(fields["tenure_remaining_months"].value)))
                if fields.get("tenure_remaining_months")
                else None,
                "end_date": fields["maturity_date"].value
                if fields.get("maturity_date")
                else None,
                "start_date": fields["start_date"].value
                if fields.get("start_date")
                else None,
                "source": "imported",
            }
            status, warning = validate_scalar("amount", outstanding.value)
            specs.append(
                CandidateSpec(
                    kind=CandidateKind.ENTITY,
                    target_domain="liability",
                    target_entity="new_liability",
                    operation=CandidateOperation.CREATE,
                    label=f"New loan — {name}",
                    proposed_value=outstanding.value,
                    proposed_payload=payload,
                    validation_state=status,
                    confidence=outstanding.confidence.value,
                    decision=CandidateDecision.ACCEPTED
                    if status != CandidateStatus.INVALID
                    else CandidateDecision.SKIPPED,
                    provenance=outstanding.provenance.to_dict(),
                    warnings=[warning] if warning else [],
                )
            )
    return specs


# ── Investment statement ───────────────────────────────────────────────────


async def _map_investments(
    session: AsyncSession,
    user_id: uuid.UUID,
    normalized: NormalizedImport,
) -> list[CandidateSpec]:
    specs: list[CandidateSpec] = []
    assets = list(
        (
            await session.execute(
                select(Asset).where(
                    Asset.user_id == user_id,
                    Asset.deleted_at.is_(None),
                )
            )
        ).scalars().all()
    )
    by_name = {_norm_name(a.name): a for a in assets}
    statement_date = normalized.period_end

    for rec in normalized.records:
        p = rec.payload
        name = p.get("name", "Holding")
        value = p.get("current_value")
        if value is None:
            continue
        existing = by_name.get(_norm_name(name))
        if existing is not None:
            specs.append(
                _field_candidate(
                    key="value",
                    label=f"{name} value",
                    target_domain="asset",
                    target_entity=f"asset:{existing.id}",
                    proposed=value,
                    current=str(existing.value),
                    matched_id=existing.id,
                    operation=CandidateOperation.UPDATE,
                    confidence=rec.confidence.value,
                    provenance=rec.provenance.to_dict(),
                    payload={"asset_id": str(existing.id), "column": "value"},
                )
            )
        else:
            asset_type = map_holding_type_to_asset(
                p.get("holding_type"), name
            )
            desc_bits = []
            if p.get("quantity"):
                desc_bits.append(f"{p['quantity']} units")
            if p.get("invested_amount"):
                desc_bits.append(f"invested {p['invested_amount']}")
            payload = {
                "asset_type": asset_type,
                "name": name,
                "value": value,
                "as_of_date": statement_date.isoformat() if statement_date else None,
                "description": "; ".join(desc_bits) or None,
                "source": "imported",
            }
            status, warning = validate_scalar("value", value)
            specs.append(
                CandidateSpec(
                    kind=CandidateKind.ENTITY,
                    target_domain="asset",
                    target_entity="new_asset",
                    operation=CandidateOperation.CREATE,
                    label=f"New holding — {name}",
                    proposed_value=value,
                    proposed_payload=payload,
                    validation_state=status,
                    confidence=rec.confidence.value,
                    decision=CandidateDecision.ACCEPTED
                    if status != CandidateStatus.INVALID
                    else CandidateDecision.SKIPPED,
                    provenance=rec.provenance.to_dict(),
                    warnings=[warning] if warning else [],
                )
            )
    return specs


# ── Bank statement ─────────────────────────────────────────────────────────


async def _map_bank(
    session: AsyncSession,
    user_id: uuid.UUID,
    normalized: NormalizedImport,
) -> list[CandidateSpec]:
    specs: list[CandidateSpec] = []

    cat_repo = ExpenseCategoryRepository(session)
    other_cat = await cat_repo.get_by_name("Other")

    # Existing records in the statement window — duplicate detection.
    start, end = normalized.period_start, normalized.period_end
    existing_expenses: list[Expense] = []
    existing_income: list[Income] = []
    if start and end:
        existing_expenses = list(
            (
                await session.execute(
                    select(Expense).where(
                        Expense.user_id == user_id,
                        Expense.deleted_at.is_(None),
                        Expense.expense_date >= start,
                        Expense.expense_date <= end,
                    )
                )
            ).scalars().all()
        )
        existing_income = list(
            (
                await session.execute(
                    select(Income).where(
                        Income.user_id == user_id,
                        Income.deleted_at.is_(None),
                        Income.income_date >= start,
                        Income.income_date <= end,
                    )
                )
            ).scalars().all()
        )
    fp_index = {
        e.import_fingerprint: e for e in existing_expenses if e.import_fingerprint
    } | {i.import_fingerprint: i for i in existing_income if i.import_fingerprint}

    seen_fps: set[str] = set()

    for rec in normalized.records:
        p = rec.payload
        fp = transaction_fingerprint(user_id, p)
        status, warning = validate_transaction(p)
        decision = CandidateDecision.ACCEPTED
        warnings = [warning] if warning else []

        # Dedup — exact fingerprint (re-import) beats heuristic.
        if fp in fp_index or fp in seen_fps:
            status = CandidateStatus.DUPLICATE
            decision = CandidateDecision.SKIPPED
            warnings.append("Already exists — imported before")
        elif status != CandidateStatus.INVALID:
            pool = (
                existing_expenses
                if p.get("direction") == "DEBIT"
                else existing_income
            )
            for row in pool:
                row_date = (
                    row.expense_date if isinstance(row, Expense) else row.income_date
                )
                if row_date != date.fromisoformat(p["date"]):
                    continue
                if Decimal(str(row.amount)) != Decimal(str(p["amount"])):
                    continue
                sim = description_similarity(
                    row.description or "", p.get("description", "")
                )
                if sim >= 0.6:
                    status = CandidateStatus.POSSIBLE_DUPLICATE
                    decision = CandidateDecision.SKIPPED
                    warnings.append(
                        "Possible duplicate of an existing record — "
                        "accept to import anyway"
                    )
                    break
        seen_fps.add(fp)

        if status == CandidateStatus.NEEDS_REVIEW:
            decision = CandidateDecision.SKIPPED

        txn_class = p.get("txn_class") or (
            rec.txn_class.value if rec.txn_class else "UNKNOWN"
        )
        if txn_class == TransactionClass.TRANSFER.value:
            target, operation, label = "transfer", CandidateOperation.SKIP, "Transfer (not imported)"
            decision = CandidateDecision.SKIPPED
        elif txn_class == TransactionClass.INCOME.value:
            target, operation, label = "income", CandidateOperation.CREATE, f"Income — {p['description'][:60]}"
        elif txn_class == TransactionClass.EXPENSE.value:
            target, operation, label = "expenses", CandidateOperation.CREATE, f"Expense — {p['description'][:60]}"
            if other_cat is None and status == CandidateStatus.VALID:
                status = CandidateStatus.NEEDS_REVIEW
                decision = CandidateDecision.SKIPPED
                warnings.append("No 'Other' expense category exists to file this under")
        else:
            target, operation, label = "unknown", CandidateOperation.SKIP, f"Unclassified — {p['description'][:60]}"
            status = CandidateStatus.NEEDS_REVIEW
            decision = CandidateDecision.SKIPPED

        specs.append(
            CandidateSpec(
                kind=CandidateKind.RECORD,
                target_domain=target,
                target_entity="transaction",
                operation=operation,
                label=label,
                proposed_value=p.get("amount"),
                proposed_payload={
                    **p,
                    "txn_class": txn_class,
                    "category_id": str(other_cat.id)
                    if other_cat and target == "expenses"
                    else None,
                },
                validation_state=status,
                confidence=rec.confidence.value,
                decision=decision,
                fingerprint=fp,
                provenance=rec.provenance.to_dict(),
                warnings=warnings,
            )
        )
    return specs


# ── Entry point ────────────────────────────────────────────────────────────


async def build_candidates(
    session: AsyncSession,
    user_id: uuid.UUID,
    normalized: NormalizedImport,
) -> list[CandidateSpec]:
    """Map a normalized import into candidate specs for the batch."""
    if normalized.document_type == DocumentType.PAYSLIP:
        return await _map_payslip(session, user_id, normalized)
    if normalized.document_type == DocumentType.LOAN_STATEMENT:
        return await _map_loan(session, user_id, normalized)
    if normalized.document_type == DocumentType.INVESTMENT_STATEMENT:
        return await _map_investments(session, user_id, normalized)
    if normalized.document_type == DocumentType.BANK_STATEMENT:
        return await _map_bank(session, user_id, normalized)
    return []
