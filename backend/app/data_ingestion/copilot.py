"""Copilot bridge for Financial Data Ingestion.

Deterministic fast-path: an explicit "import this statement/payslip"
message runs the same ingestion pipeline as ``POST /v1/imports/from-text``
and returns a ``data_import_card`` artifact + NAVIGATE action to the
review screen. The copilot never auto-commits — confirmation always
happens in the Import Center.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.data_ingestion.errors import IngestionError
from app.data_ingestion.service import DataIngestionService
from app.data_ingestion.types import IngestionErrorCode
from app.financial.artifacts.schemas import Artifact, ArtifactType

# Explicit import phrasing only — document-ish nouns alone ("statement")
# must not hijack ordinary analysis questions.
_IMPORT_PATTERNS = [
    r"\bimport\b",
    r"\bingest\b",
    r"\bupload\b",
    r"add\s+(this|my)\s+(payslip|salary\s+slip|statement|document)",
    r"update\s+my\s+(records?|finances|income|expenses|loans?|investments?)\s+"
    r"from\s+(this|my|the)",
    r"read\s+(this|my)\s+(payslip|salary\s+slip|statement)",
]
_IMPORT_RE = re.compile("|".join(_IMPORT_PATTERNS), re.IGNORECASE)


def is_import_request(message: str) -> bool:
    """True only when the user explicitly asks to import a document."""
    return bool(_IMPORT_RE.search(message or ""))


def _artifact(batch_id: uuid.UUID, preview: Any, title: str) -> Artifact:
    return Artifact(
        type=ArtifactType.DATA_IMPORT_CARD.value,
        title=title,
        content={
            "batchId": str(batch_id),
            "documentType": preview.batch.document_type.value,
            "fileName": preview.batch.file_name,
            "status": preview.batch.status.value,
            "counts": preview.counts,
            "periodStart": preview.batch.period_start.isoformat()
            if preview.batch.period_start
            else None,
            "periodEnd": preview.batch.period_end.isoformat()
            if preview.batch.period_end
            else None,
        },
    )


def _navigate_action(batch_id: uuid.UUID | None = None) -> dict[str, Any]:
    return {
        "id": "open_import_review" if batch_id else "open_import_center",
        "label": "Review import" if batch_id else "Open Import Center",
        "type": "NAVIGATE",
        "route": "import_center",
        "payload": {"batchId": str(batch_id)} if batch_id else {},
    }


async def run_import(
    session: AsyncSession,
    user_id: uuid.UUID,
    attachments: list[Any],
) -> tuple[str, dict]:
    """Ingest the first attachment (full text, not the truncated block).

    Returns ``(message_text, event_payload)``. Controlled failures return
    a safe explanation — no stack traces, no silent success.
    """
    service = DataIngestionService(session)
    if not attachments:
        text = (
            "I can import that — upload the document in the Import Center "
            "and I'll prepare a review for you to confirm."
        )
        return text, {
            "artifacts": [
                Artifact(
                    type=ArtifactType.DATA_IMPORT_CARD.value,
                    title="Import a document",
                    content={"status": "NEEDS_DOCUMENT"},
                ).model_dump(mode="json", by_alias=True)
            ],
            "suggestedActions": [_navigate_action()],
        }

    att = attachments[0]
    try:
        preview = await service.ingest_text(
            user_id,
            att.filename,
            att.content,
            att.mime_type,
            source_name="copilot",
        )
    except IngestionError as exc:
        if exc.code == IngestionErrorCode.DUPLICATE_IMPORT:
            batch_id = (exc.details or {}).get("existingBatchId")
            text = (
                "This exact document was already imported. "
                "Open the existing review instead of re-uploading."
            )
            return text, {
                "artifacts": [
                    Artifact(
                        type=ArtifactType.DATA_IMPORT_CARD.value,
                        title="Already imported",
                        content={
                            "status": "DUPLICATE_IMPORT",
                            "batchId": batch_id,
                        },
                    ).model_dump(mode="json", by_alias=True)
                ],
                "suggestedActions": [
                    _navigate_action(
                        uuid.UUID(batch_id) if batch_id else None
                    )
                ],
            }
        return exc.message, {
            "artifacts": [
                Artifact(
                    type=ArtifactType.DATA_IMPORT_CARD.value,
                    title="Couldn't import",
                    content={"status": "FAILED", "code": exc.code.value},
                ).model_dump(mode="json", by_alias=True)
            ],
            "suggestedActions": [_navigate_action()],
        }

    counts = preview.counts or {}
    changes = counts.get("changes", 0)
    doc_label = preview.batch.document_type.value.replace("_", " ").title()
    text = (
        f"I read your {doc_label} and prepared "
        f"{changes} change{'s' if changes != 1 else ''} for review"
        + (
            f" ({counts.get('duplicates', 0)} already exist, "
            f"{counts.get('needsReview', 0)} need your check)."
            if counts.get("duplicates") or counts.get("needsReview")
            else "."
        )
        + " Nothing is applied until you confirm in the Import Center."
    )
    return text, {
        "importPreview": {
            "batchId": str(preview.batch.id),
            "documentType": preview.batch.document_type.value,
            "fileName": preview.batch.file_name,
            "counts": counts,
        },
        "artifacts": [
            _artifact(
                preview.batch.id, preview, f"{doc_label} — ready to review"
            ).model_dump(mode="json", by_alias=True)
        ],
        "suggestedActions": [_navigate_action(preview.batch.id)],
    }
