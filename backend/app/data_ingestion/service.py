"""DataIngestionService — Phase 5 orchestration.

Pipeline per upload:

    extract_document            (bytes → text — never persisted raw)
      → detect_document_type    (deterministic scoring / declared type)
      → extractor               (text → NormalizedImport)
      → build_candidates        (normalized → ImportCandidate rows)
      → REVIEW_REQUIRED         (awaiting the user)
      → confirm(confirm_token)  (token must match the reviewed version)
      → ImportCommitter         (the single mutation boundary)
      → Money Radar scan
      → Action Plan reconcile

Financial state is never mutated before explicit confirmation.
"""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger
from app.data_ingestion.commit import ImportCommitter
from app.data_ingestion.detection import detect_document_type
from app.data_ingestion.errors import IngestionError
from app.data_ingestion.extraction import ExtractedDocument, extract_document
from app.data_ingestion.extractors import EXTRACTORS
from app.data_ingestion.fingerprints import content_hash, text_hash
from app.data_ingestion.impact import affected_domains
from app.data_ingestion.mapping import CandidateSpec, build_candidates
from app.data_ingestion.normalized import NormalizedImport
from app.data_ingestion.schemas import (
    ImportBatchOut,
    ImportCandidateOut,
    ImportPreviewOut,
    ImportResultOut,
    ImportSummary,
)
from app.data_ingestion.types import (
    CandidateDecision,
    CandidateStatus,
    DocumentType,
    INGESTION_VERSION,
    ImportStatus,
    IngestionErrorCode,
    MAX_CANDIDATES_PER_BATCH,
    batch_can_confirm,
    batch_is_terminal,
)
from app.data_ingestion.validators import validate_edited_value
from app.models.data_ingestion import ImportBatch, ImportCandidate
from app.repositories.data_ingestion import (
    ImportBatchRepository,
    ImportCandidateRepository,
)


class DataIngestionService:
    """Orchestrates upload → extract → review → confirm → recompute."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._batches = ImportBatchRepository(session)
        self._candidates = ImportCandidateRepository(session)

    # ── Ingestion ────────────────────────────────────────────────────────

    async def ingest_bytes(
        self,
        user_id: uuid.UUID,
        file_name: str,
        content: bytes,
        mime_type: str | None = None,
        declared_type: DocumentType | None = None,
        source_name: str = "upload",
    ) -> ImportPreviewOut:
        """Upload path — bytes are hashed, extracted in-memory, never stored."""
        digest = content_hash(content)
        existing = await self._batches.get_by_hash(user_id, digest)
        if existing is not None:
            raise IngestionError.duplicate_import(existing.id)

        doc = extract_document(content, file_name, mime_type)
        return await self._process(
            user_id, doc, digest, file_name, mime_type, declared_type,
            source_name,
        )

    async def ingest_text(
        self,
        user_id: uuid.UUID,
        file_name: str,
        content: str,
        mime_type: str = "text/plain",
        declared_type: DocumentType | None = None,
        source_name: str = "copilot",
    ) -> ImportPreviewOut:
        """Copilot path — the document arrives as pre-extracted text, so
        extraction is bypassed (a '.pdf' name here is the ORIGINAL file's
        name, not binary content). CSV structure is still sniffed."""
        digest = text_hash(content)
        existing = await self._batches.get_by_hash(user_id, digest)
        if existing is not None:
            raise IngestionError.duplicate_import(existing.id)

        from app.data_ingestion.extraction import _extract_csv

        doc = ExtractedDocument(text=content)
        headers, rows = _extract_csv(content)
        if headers and rows:
            doc.is_csv = True
            doc.csv_headers, doc.csv_rows = headers, rows
        if not doc.text.strip() and not doc.csv_rows:
            raise IngestionError.empty_document()

        return await self._process(
            user_id, doc, digest, file_name, mime_type, declared_type,
            source_name,
        )

    async def _process(
        self,
        user_id: uuid.UUID,
        doc: ExtractedDocument,
        digest: str,
        file_name: str,
        mime_type: str | None,
        declared_type: DocumentType | None,
        source_name: str,
    ) -> ImportPreviewOut:
        doc_type, _scores = detect_document_type(doc, declared_type)
        if doc_type is None:
            raise IngestionError.ambiguous_document()

        extractor = EXTRACTORS[doc_type]()
        normalized = extractor.extract(
            doc.text, doc.pages or None, doc.csv_headers or None,
            doc.csv_rows or None,
        )

        specs = await build_candidates(self._session, user_id, normalized)
        if len(specs) > MAX_CANDIDATES_PER_BATCH:
            specs = specs[:MAX_CANDIDATES_PER_BATCH]
            normalized.warnings.append(
                f"Import capped at {MAX_CANDIDATES_PER_BATCH} records."
            )

        batch = ImportBatch(
            user_id=user_id,
            document_type=doc_type.value,
            source_name=source_name,
            file_name=file_name[:255],
            mime_type=mime_type,
            content_hash=digest,
            status=ImportStatus.REVIEW_REQUIRED.value,
            period_start=normalized.period_start,
            period_end=normalized.period_end,
            confirm_token=secrets.token_hex(16),
            summary=self._batch_summary(normalized, specs),
            ingestion_version=INGESTION_VERSION,
            extracted_at=datetime.now(timezone.utc),
        )
        batch = await self._batches.create(batch)

        for seq, spec in enumerate(specs, start=1):
            await self._candidates.create(
                self._row(batch, user_id, spec, seq)
            )

        return await self.get_preview(user_id, batch.id)

    @staticmethod
    def _row(
        batch: ImportBatch,
        user_id: uuid.UUID,
        spec: CandidateSpec,
        seq: int,
    ) -> ImportCandidate:
        return ImportCandidate(
            batch_id=batch.id,
            user_id=user_id,
            kind=spec.kind.value,
            target_domain=spec.target_domain,
            target_entity=spec.target_entity,
            operation=spec.operation.value,
            field_name=spec.field_name,
            label=spec.label,
            current_value=spec.current_value,
            proposed_value=spec.proposed_value,
            proposed_payload=spec.proposed_payload,
            matched_entity_id=spec.matched_entity_id,
            validation_state=spec.validation_state.value,
            confidence=spec.confidence,
            decision=spec.decision.value,
            fingerprint=spec.fingerprint,
            provenance=spec.provenance,
            warnings=spec.warnings,
            seq=seq,
        )

    @staticmethod
    def _batch_summary(
        normalized: NormalizedImport, specs: list[CandidateSpec]
    ) -> dict[str, Any]:
        counts: dict[str, int] = {
            "fields": len(normalized.fields),
            "records": len(normalized.records),
            "changes": 0,
            "warnings": len(normalized.warnings)
            + sum(1 for s in specs if s.warnings),
            "duplicates": 0,
            "needsReview": 0,
            "invalid": 0,
        }
        for spec in specs:
            if spec.validation_state in (
                CandidateStatus.VALID,
                CandidateStatus.WARNING,
            ) and spec.operation.value != "SKIP":
                counts["changes"] += 1
            elif spec.validation_state in (
                CandidateStatus.DUPLICATE,
                CandidateStatus.POSSIBLE_DUPLICATE,
            ):
                counts["duplicates"] += 1
            elif spec.validation_state == CandidateStatus.NEEDS_REVIEW:
                counts["needsReview"] += 1
            elif spec.validation_state == CandidateStatus.INVALID:
                counts["invalid"] += 1
        return {
            "counts": counts,
            "warnings": normalized.warnings,
            "detectedFields": [
                {
                    "key": f.key,
                    "label": f.label,
                    "value": f.value if not hasattr(f.value, "isoformat") else f.value.isoformat(),
                    "confidence": f.confidence.value,
                    "provenance": f.provenance.to_dict(),
                }
                for f in normalized.fields
            ],
            "meta": normalized.meta,
        }

    # ── Retrieval ────────────────────────────────────────────────────────

    async def list_batches(
        self, user_id: uuid.UUID, *, skip: int = 0, limit: int = 50
    ) -> list[ImportSummary]:
        rows, _ = await self._batches.list_for_user(
            user_id, skip=skip, limit=limit
        )
        return [self._summary(r) for r in rows]

    async def get_batch(
        self, user_id: uuid.UUID, batch_id: uuid.UUID
    ) -> ImportBatchOut:
        batch = await self._require(user_id, batch_id)
        return self._batch_out(batch)

    async def get_preview(
        self, user_id: uuid.UUID, batch_id: uuid.UUID
    ) -> ImportPreviewOut:
        batch = await self._require(user_id, batch_id)
        candidates = await self._candidates.list_for_batch(batch.id)
        counts = dict((batch.summary or {}).get("counts") or {})
        return ImportPreviewOut(
            batch=self._batch_out(batch),
            candidates=[self._candidate_out(c) for c in candidates],
            detected_fields=(batch.summary or {}).get("detectedFields", []),
            counts=counts,
        )

    async def get_changes(
        self, user_id: uuid.UUID, batch_id: uuid.UUID
    ) -> ImportResultOut:
        batch = await self._require(user_id, batch_id)
        result = batch.result or {}
        return ImportResultOut.model_validate(
            {"batch_id": batch.id, "status": batch.status, **result}
        )

    # ── Review ───────────────────────────────────────────────────────────

    async def decide_candidate(
        self,
        user_id: uuid.UUID,
        batch_id: uuid.UUID,
        candidate_id: uuid.UUID,
        *,
        decision: CandidateDecision | None = None,
        edited_value: Any = None,
    ) -> ImportCandidateOut:
        batch = await self._require(user_id, batch_id)
        if batch.status != ImportStatus.REVIEW_REQUIRED.value:
            raise IngestionError.invalid_status(batch.status, "edited")
        cand = await self._candidates.get_for_user(user_id, candidate_id)
        if cand is None or cand.batch_id != batch.id:
            raise IngestionError.invalid_candidate()

        if edited_value is not None:
            try:
                cand.edited_value = validate_edited_value(
                    cand.kind, cand.field_name or "", edited_value
                )
            except ValueError as exc:
                raise IngestionError.invalid_value(str(exc))
            cand.decision = CandidateDecision.EDITED.value
        if decision is not None:
            cand.decision = decision.value
            if decision == CandidateDecision.EDITED and edited_value is None:
                raise IngestionError.invalid_value(
                    "An edited decision requires editedValue."
                )
        cand.updated_at = datetime.now(timezone.utc)

        # Any edit rotates the confirmation token — confirmations always
        # apply to the exact version the user last saw (§58).
        batch.confirm_token = secrets.token_hex(16)
        batch.updated_at = datetime.now(timezone.utc)
        await self._session.flush()
        return self._candidate_out(cand)

    # ── Confirm / cancel ─────────────────────────────────────────────────

    async def confirm(
        self,
        user_id: uuid.UUID,
        batch_id: uuid.UUID,
        confirm_token: str,
    ) -> ImportResultOut:
        batch = await self._require(user_id, batch_id)

        if batch.status in (
            ImportStatus.APPLIED.value,
            ImportStatus.PARTIALLY_APPLIED.value,
        ):
            raise IngestionError.already_applied()
        if batch.status == ImportStatus.CANCELLED.value:
            raise IngestionError.already_cancelled()
        if not batch_can_confirm(batch.status):
            raise IngestionError.invalid_status(batch.status, "confirmed")
        if not secrets.compare_digest(batch.confirm_token, confirm_token):
            raise IngestionError.stale_preview()

        candidates = await self._candidates.list_for_batch(batch.id)

        # Stale-source guard: UPDATE candidates must still see the same
        # current value they were previewed against (§88).
        stale = await self._stale_fields(user_id, candidates)
        if stale:
            batch.status = ImportStatus.REVIEW_REQUIRED.value
            batch.confirm_token = secrets.token_hex(16)
            await self._session.flush()
            raise IngestionError(
                code=IngestionErrorCode.STALE_PREVIEW,
                message=(
                    "These values changed since your review: "
                    + ", ".join(stale)
                ),
                status_code=409,
                details={"staleFields": stale},
            )

        batch.status = ImportStatus.CONFIRMED.value
        batch.confirmed_at = datetime.now(timezone.utc)

        outcome = await ImportCommitter(self._session).apply(
            user_id, batch, candidates
        )

        failed_total = sum(outcome.failed.values())
        batch.status = (
            ImportStatus.PARTIALLY_APPLIED.value
            if failed_total
            else ImportStatus.APPLIED.value
        )
        batch.applied_at = datetime.now(timezone.utc)

        changed = affected_domains(
            DocumentType(batch.document_type), outcome.changed_domains
        )
        result = {
            "applied_counts": outcome.applied,
            "skipped_counts": outcome.skipped,
            "warning_counts": {
                "failed": failed_total,
                "warnings": sum(
                    len(c.warnings or []) for c in candidates
                ),
            },
            "changed_domains": changed,
            "recalculated": changed,
            "radar_refreshed": False,
            "plan_reconciled": False,
        }

        # Recompute intelligence — engines are computed on demand, so the
        # persisted refresh is Radar + Plan (§40).
        try:
            from app.action_plan.service import FinancialActionPlanService

            plan = await FinancialActionPlanService(
                self._session
            ).get_or_generate_current(user_id, force_rescan=True)
            result["radar_refreshed"] = True
            result["plan_reconciled"] = True
            result["plan_active_count"] = plan.active_count
        except Exception:
            logger.exception(
                "Post-import recompute failed",
                extra={"batch_id": str(batch.id)},
            )
            result["recompute_error"] = "Recomputation failed — refresh later"

        batch.result = result
        batch.updated_at = datetime.now(timezone.utc)

        self._audit(user_id, batch, result)
        await self._session.flush()

        return ImportResultOut.model_validate(
            {"batch_id": batch.id, "status": batch.status, **result}
        )

    async def cancel(
        self, user_id: uuid.UUID, batch_id: uuid.UUID
    ) -> ImportBatchOut:
        batch = await self._require(user_id, batch_id)
        if batch_is_terminal(batch.status):
            raise IngestionError.invalid_status(batch.status, "cancelled")
        batch.status = ImportStatus.CANCELLED.value
        batch.cancelled_at = datetime.now(timezone.utc)
        batch.updated_at = batch.cancelled_at
        await self._session.flush()
        return self._batch_out(batch)

    # ── Internals ────────────────────────────────────────────────────────

    async def _stale_fields(
        self, user_id: uuid.UUID, candidates: list[ImportCandidate]
    ) -> list[str]:
        """Re-check current values for UPDATE candidates before commit."""
        from decimal import Decimal

        from sqlalchemy import select

        from app.models.assets import Asset
        from app.models.income import Income
        from app.models.liabilities import Liability
        from app.models.tax_profiles import TaxProfile

        stale: list[str] = []
        for cand in candidates:
            if cand.operation != "UPDATE" or cand.current_value is None:
                continue
            if cand.decision == CandidateDecision.SKIPPED.value:
                continue
            domain = cand.target_domain
            current: Any = None
            if domain == "income":
                primary = await IncomeRepository(self._session).get_primary_by_user(
                    user_id
                )
                current = str(primary.amount) if primary else None
            elif domain == "tax":
                row = (
                    await self._session.execute(
                        select(TaxProfile).where(
                            TaxProfile.user_id == user_id,
                            TaxProfile.deleted_at.is_(None),
                        )
                    )
                ).scalar_one_or_none()
                col = cand.proposed_payload.get("column") or cand.field_name
                current = str(getattr(row, col, None)) if row else None
            elif domain == "liability":
                row = (
                    await self._session.execute(
                        select(Liability).where(
                            Liability.id
                            == uuid.UUID(str(cand.proposed_payload.get("liability_id"))),
                            Liability.user_id == user_id,
                            Liability.deleted_at.is_(None),
                        )
                    )
                ).scalar_one_or_none()
                col = cand.proposed_payload.get("column") or cand.field_name
                current = str(getattr(row, col, None)) if row else None
            elif domain == "asset":
                row = (
                    await self._session.execute(
                        select(Asset).where(
                            Asset.id
                            == uuid.UUID(str(cand.proposed_payload.get("asset_id"))),
                            Asset.user_id == user_id,
                            Asset.deleted_at.is_(None),
                        )
                    )
                ).scalar_one_or_none()
                current = str(row.value) if row else None
            try:
                if current is not None and Decimal(str(current)) != Decimal(
                    str(cand.current_value)
                ):
                    stale.append(cand.label)
            except Exception:
                continue
        return stale

    def _audit(
        self, user_id: uuid.UUID, batch: ImportBatch, result: dict
    ) -> None:
        """Operational audit — counts only, never raw financial content."""
        from app.models.audit_logs import AuditLog

        self._session.add(
            AuditLog(
                user_id=user_id,
                action="import.confirmed",
                entity_type="import_batch",
                entity_id=str(batch.id),
                details={
                    "documentType": batch.document_type,
                    "status": batch.status,
                    "applied": result.get("applied_counts", {}),
                    "skipped": result.get("skipped_counts", {}),
                    "changedDomains": result.get("changed_domains", []),
                    "ingestionVersion": batch.ingestion_version,
                },
            )
        )

    async def _require(
        self, user_id: uuid.UUID, batch_id: uuid.UUID
    ) -> ImportBatch:
        batch = await self._batches.get_for_user(user_id, batch_id)
        if batch is None:
            raise IngestionError.not_found()
        return batch

    # ── Serialisation ────────────────────────────────────────────────────

    @staticmethod
    def _batch_out(row: ImportBatch) -> ImportBatchOut:
        return ImportBatchOut.model_validate(row)

    @staticmethod
    def _summary(row: ImportBatch) -> ImportSummary:
        return ImportSummary.model_validate(row)

    @staticmethod
    def _candidate_out(row: ImportCandidate) -> ImportCandidateOut:
        return ImportCandidateOut.model_validate(row)
