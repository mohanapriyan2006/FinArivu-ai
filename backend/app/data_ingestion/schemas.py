"""Typed wire contracts for the import API — camelCase via BaseSchema."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from app.data_ingestion.types import (
    CandidateDecision,
    CandidateKind,
    CandidateOperation,
    CandidateStatus,
    Confidence,
    DocumentType,
    ImportStatus,
)
from app.schemas.base import BaseSchema


# ── Candidates ─────────────────────────────────────────────────────────────


class ImportCandidateOut(BaseSchema):
    id: UUID
    batch_id: UUID
    kind: CandidateKind
    target_domain: str
    target_entity: str = ""
    operation: CandidateOperation
    field_name: str | None = None
    label: str = ""
    current_value: Any = None
    proposed_value: Any = None
    proposed_payload: dict[str, Any] = Field(default_factory=dict)
    edited_value: Any = None
    matched_entity_id: UUID | None = None
    validation_state: CandidateStatus
    confidence: Confidence
    decision: CandidateDecision
    fingerprint: str | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    seq: int = 0
    applied_at: datetime | None = None
    applied_entity_id: UUID | None = None


# ── Batch / preview ────────────────────────────────────────────────────────


class ImportBatchOut(BaseSchema):
    id: UUID
    document_type: DocumentType
    source_name: str
    file_name: str = ""
    status: ImportStatus
    period_start: date | None = None
    period_end: date | None = None
    confirm_token: str = ""
    summary: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    error_code: str | None = None
    data_quality: str = "AVAILABLE"
    ingestion_version: str = ""
    created_at: datetime | None = None
    extracted_at: datetime | None = None
    confirmed_at: datetime | None = None
    applied_at: datetime | None = None
    cancelled_at: datetime | None = None


class ImportSummary(BaseSchema):
    """Compact history row for the Import Center."""

    id: UUID
    document_type: DocumentType
    file_name: str = ""
    status: ImportStatus
    period_start: date | None = None
    period_end: date | None = None
    summary: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
    applied_at: datetime | None = None


class ImportPreviewOut(BaseSchema):
    """The full review payload — batch + grouped candidates."""

    batch: ImportBatchOut
    candidates: list[ImportCandidateOut] = Field(default_factory=list)
    detected_fields: list[dict[str, Any]] = Field(default_factory=list)
    counts: dict[str, int] = Field(default_factory=dict)


class ImportResultOut(BaseSchema):
    """Post-confirmation result — what changed + what was recalculated."""

    batch_id: UUID
    status: ImportStatus
    applied_counts: dict[str, int] = Field(default_factory=dict)
    skipped_counts: dict[str, int] = Field(default_factory=dict)
    warning_counts: dict[str, int] = Field(default_factory=dict)
    changed_domains: list[str] = Field(default_factory=list)
    recalculated: list[str] = Field(default_factory=list)
    radar_refreshed: bool = False
    plan_reconciled: bool = False
    applied_at: datetime | None = None


# ── Requests ───────────────────────────────────────────────────────────────


class IngestTextRequest(BaseSchema):
    """Copilot/text-path ingestion — extracted document text."""

    file_name: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=500000)
    mime_type: str = Field(default="text/plain", max_length=120)
    document_type: DocumentType | None = None


class DecideCandidateRequest(BaseSchema):
    """Review decision on a single candidate."""

    decision: CandidateDecision | None = None
    edited_value: Any = None


class ConfirmImportRequest(BaseSchema):
    """Confirmation carries the token issued at preview time — the batch
    only applies when it still matches (idempotent + stale-safe)."""

    confirm_token: str = Field(..., min_length=8, max_length=80)
