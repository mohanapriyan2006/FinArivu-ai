"""ImportCommitter — the ONE mutation boundary for confirmed imports.

Parsers never write to financial tables; this service applies only
candidates the user accepted (or edited) inside a single DB session —
the request-level transaction makes the commit atomic unless a
candidate-level failure is recorded (then PARTIALLY_APPLIED).
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data_ingestion.types import (
    CandidateDecision,
    CandidateKind,
    CandidateOperation,
    CandidateStatus,
    ImportStatus,
)
from app.models.assets import Asset
from app.models.data_ingestion import ImportBatch, ImportCandidate
from app.models.expenses import Expense
from app.models.income import Income
from app.models.liabilities import Liability
from app.models.profiles import Profile
from app.models.tax_profiles import TaxProfile
from app.repositories.income import IncomeRepository


@dataclass
class CommitOutcome:
    applied: dict[str, int] = field(default_factory=dict)
    skipped: dict[str, int] = field(default_factory=dict)
    failed: dict[str, int] = field(default_factory=dict)
    changed_domains: set[str] = field(default_factory=set)
    warnings: int = 0


def _final_value(candidate: ImportCandidate) -> Any:
    """The value to commit — the user's edit wins over the extraction."""
    if candidate.decision == CandidateDecision.EDITED.value and (
        candidate.edited_value is not None
    ):
        return candidate.edited_value
    return candidate.proposed_value


class ImportCommitter:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._income_repo = IncomeRepository(session)

    async def apply(
        self,
        user_id: uuid.UUID,
        batch: ImportBatch,
        candidates: list[ImportCandidate],
    ) -> CommitOutcome:
        outcome = CommitOutcome()
        now = datetime.now(timezone.utc)

        for cand in candidates:
            if cand.decision == CandidateDecision.SKIPPED.value:
                outcome.skipped[cand.target_domain] = (
                    outcome.skipped.get(cand.target_domain, 0) + 1
                )
                continue
            if cand.validation_state == CandidateStatus.INVALID.value:
                outcome.skipped[cand.target_domain] = (
                    outcome.skipped.get(cand.target_domain, 0) + 1
                )
                continue
            if cand.operation in (
                CandidateOperation.SKIP.value,
                CandidateOperation.SKIP,
            ):
                outcome.skipped[cand.target_domain] = (
                    outcome.skipped.get(cand.target_domain, 0) + 1
                )
                continue

            try:
                entity_id = await self._apply_candidate(user_id, batch, cand)
            except Exception:
                outcome.failed[cand.target_domain] = (
                    outcome.failed.get(cand.target_domain, 0) + 1
                )
                continue

            cand.applied_at = now
            cand.applied_entity_id = entity_id
            outcome.applied[cand.target_domain] = (
                outcome.applied.get(cand.target_domain, 0) + 1
            )
            outcome.changed_domains.add(cand.target_domain)

        await self._session.flush()
        return outcome

    # ── Per-candidate application ────────────────────────────────────────

    async def _apply_candidate(
        self, user_id: uuid.UUID, batch: ImportBatch, cand: ImportCandidate
    ) -> uuid.UUID | None:
        if cand.kind == CandidateKind.RECORD.value:
            return await self._apply_record(user_id, batch, cand)
        if cand.kind == CandidateKind.ENTITY.value:
            return await self._apply_entity(user_id, batch, cand)
        return await self._apply_field(user_id, batch, cand)

    async def _apply_field(
        self, user_id: uuid.UUID, batch: ImportBatch, cand: ImportCandidate
    ) -> uuid.UUID | None:
        value = _final_value(cand)
        domain = cand.target_domain

        if domain == "income":
            primary = await self._income_repo.get_primary_by_user(user_id)
            amount = Decimal(str(value))
            if primary is not None:
                primary.amount = amount
                primary.import_batch_id = batch.id
                primary.import_fingerprint = cand.fingerprint
                await self._sync_profile_income(user_id, amount)
                await self._session.flush()
                return primary.id
            row = Income(
                user_id=user_id,
                amount=amount,
                source="Salary",
                income_date=date.today(),
                is_recurring=True,
                is_primary=True,
                frequency="monthly",
                import_batch_id=batch.id,
                import_fingerprint=cand.fingerprint,
            )
            self._session.add(row)
            await self._session.flush()
            await self._sync_profile_income(user_id, amount)
            return row.id

        if domain == "tax":
            row = (
                await self._session.execute(
                    select(TaxProfile).where(
                        TaxProfile.user_id == user_id,
                        TaxProfile.deleted_at.is_(None),
                    )
                )
            ).scalar_one_or_none()
            if row is None:
                row = TaxProfile(user_id=user_id)
                self._session.add(row)
            column = cand.proposed_payload.get("column") or cand.field_name
            setattr(row, column, Decimal(str(value)))
            await self._session.flush()
            return row.id

        if domain == "liability":
            li_id = uuid.UUID(str(cand.proposed_payload.get("liability_id")))
            row = await self._owned(Liability, user_id, li_id)
            column = cand.proposed_payload.get("column") or cand.field_name
            if column in ("start_date", "end_date"):
                setattr(row, column, self._date(value))
            elif column in ("remaining_tenure_months", "tenure_months"):
                setattr(row, column, int(Decimal(str(value))))
            else:
                setattr(row, column, self._coerce(value))
            row.source = "imported"
            await self._session.flush()
            return row.id

        if domain == "asset":
            asset_id = uuid.UUID(str(cand.proposed_payload.get("asset_id")))
            row = await self._owned(Asset, user_id, asset_id)
            row.value = Decimal(str(value))
            row.source = "imported"
            await self._session.flush()
            return row.id

        raise ValueError(f"Unsupported field domain: {domain}")

    async def _apply_entity(
        self, user_id: uuid.UUID, batch: ImportBatch, cand: ImportCandidate
    ) -> uuid.UUID | None:
        payload = dict(cand.proposed_payload)
        payload.pop("liability_id", None)
        payload.pop("asset_id", None)
        payload.pop("column", None)
        if cand.edited_value is not None:
            payload["value" if cand.target_domain == "asset" else "amount"] = (
                cand.edited_value
            )

        if cand.target_domain == "liability":
            row = Liability(
                user_id=user_id,
                liability_type=payload.get("liability_type", "Other"),
                name=str(payload.get("name") or "Imported loan")[:255],
                amount=Decimal(str(payload.get("amount", "0"))),
                interest_rate=self._dec(payload.get("interest_rate")),
                emi=self._dec(payload.get("emi")),
                remaining_tenure_months=(
                    int(payload["remaining_tenure_months"])
                    if payload.get("remaining_tenure_months") is not None
                    else None
                ),
                start_date=self._date(payload.get("start_date")),
                end_date=self._date(payload.get("end_date")),
                source="imported",
            )
            self._session.add(row)
            await self._session.flush()
            return row.id

        if cand.target_domain == "asset":
            row = Asset(
                user_id=user_id,
                asset_type=payload.get("asset_type", "Other"),
                name=str(payload.get("name") or "Imported holding")[:255],
                value=Decimal(str(payload.get("value", "0"))),
                as_of_date=self._date(payload.get("as_of_date")),
                description=payload.get("description"),
                source="imported",
            )
            self._session.add(row)
            await self._session.flush()
            return row.id

        raise ValueError(f"Unsupported entity domain: {cand.target_domain}")

    async def _apply_record(
        self, user_id: uuid.UUID, batch: ImportBatch, cand: ImportCandidate
    ) -> uuid.UUID | None:
        p = cand.proposed_payload
        amount = Decimal(str(cand.edited_value or p.get("amount", "0")))
        txn_date = date.fromisoformat(str(p["date"]))
        desc = str(p.get("description") or "Imported transaction")[:1000]

        if cand.target_domain == "expenses":
            row = Expense(
                user_id=user_id,
                category_id=uuid.UUID(str(p["category_id"])),
                amount=amount,
                description=desc,
                expense_date=txn_date,
                payment_method=p.get("payment_method") or "Bank Transfer",
                is_recurring=False,
                source="imported",
                import_batch_id=batch.id,
                import_fingerprint=cand.fingerprint,
            )
            self._session.add(row)
            await self._session.flush()
            return row.id

        if cand.target_domain == "income":
            row = Income(
                user_id=user_id,
                amount=amount,
                source=str(p.get("income_source") or "Other"),
                income_date=txn_date,
                description=desc,
                is_recurring=False,
                is_primary=False,
                import_batch_id=batch.id,
                import_fingerprint=cand.fingerprint,
            )
            self._session.add(row)
            await self._session.flush()
            return row.id

        raise ValueError(f"Unsupported record domain: {cand.target_domain}")

    # ── Helpers ──────────────────────────────────────────────────────────

    async def _sync_profile_income(
        self, user_id: uuid.UUID, amount: Decimal
    ) -> None:
        """Keep Profile.monthly_income in step with the primary Income row."""
        profile = (
            await self._session.execute(
                select(Profile).where(
                    Profile.user_id == user_id,
                    Profile.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if profile is not None:
            profile.monthly_income = amount
            await self._session.flush()

    async def _owned(self, model, user_id: uuid.UUID, entity_id: uuid.UUID):
        row = (
            await self._session.execute(
                select(model).where(
                    model.id == entity_id,
                    model.user_id == user_id,
                    model.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if row is None:
            raise ValueError("Matched entity no longer exists")
        return row

    @staticmethod
    def _dec(value: Any) -> Decimal | None:
        return Decimal(str(value)) if value is not None else None

    @staticmethod
    def _date(value: Any) -> date | None:
        if not value:
            return None
        return date.fromisoformat(str(value)[:10])

    @staticmethod
    def _coerce(value: Any) -> Any:
        if isinstance(value, (int, float)):
            return Decimal(str(value))
        if isinstance(value, str):
            try:
                return Decimal(value)
            except Exception:
                return value
        return value
