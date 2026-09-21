"""Controlled vocabularies for Financial Data Ingestion (Phase 5).

Documents are imported through a deterministic pipeline:

    upload → detect → extract → normalize → validate → candidates
    → user preview/edit → explicit confirm → commit → recompute

The parser never mutates financial state — it produces typed
``ImportCandidate`` rows. Only the commit layer writes, and only after
explicit user confirmation.
"""

from __future__ import annotations

from enum import Enum


class DocumentType(str, Enum):
    """Canonical supported document types — never scattered strings."""

    PAYSLIP = "PAYSLIP"
    BANK_STATEMENT = "BANK_STATEMENT"
    LOAN_STATEMENT = "LOAN_STATEMENT"
    INVESTMENT_STATEMENT = "INVESTMENT_STATEMENT"


class ImportStatus(str, Enum):
    """Import batch lifecycle.

        UPLOADED → PROCESSING → REVIEW_REQUIRED → CONFIRMED → APPLIED
                                                      ↘ PARTIALLY_APPLIED
        any non-terminal → FAILED / CANCELLED

    APPLIED / PARTIALLY_APPLIED / CANCELLED / FAILED are terminal for the
    batch (FAILED batches may be retried via a fresh upload).
    """

    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    CONFIRMED = "CONFIRMED"
    APPLIED = "APPLIED"
    PARTIALLY_APPLIED = "PARTIALLY_APPLIED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class CandidateKind(str, Enum):
    """What a candidate proposes to change."""

    FIELD = "FIELD"          # single field on an existing entity (income, loan…)
    ENTITY = "ENTITY"        # a whole new entity (loan, holding)
    RECORD = "RECORD"        # a bank-statement transaction


class CandidateOperation(str, Enum):
    """The commit-layer operation a candidate maps to."""

    UPDATE = "UPDATE"
    CREATE = "CREATE"
    SKIP = "SKIP"


class CandidateStatus(str, Enum):
    """Validation state of a candidate — drives review UI."""

    VALID = "VALID"
    WARNING = "WARNING"
    INVALID = "INVALID"
    DUPLICATE = "DUPLICATE"           # exact fingerprint match — auto-skip
    POSSIBLE_DUPLICATE = "POSSIBLE_DUPLICATE"  # ambiguous — user decides
    NEEDS_REVIEW = "NEEDS_REVIEW"     # e.g. UNKNOWN transaction type


class CandidateDecision(str, Enum):
    """The user's review decision on a candidate."""

    ACCEPTED = "ACCEPTED"    # apply as extracted
    EDITED = "EDITED"        # apply the user-edited value
    SKIPPED = "SKIPPED"      # do not apply


class TransactionClass(str, Enum):
    """Bank-statement transaction classification (deterministic rules)."""

    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"
    UNKNOWN = "UNKNOWN"


class TransactionDirection(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class Confidence(str, Enum):
    """Extraction confidence — NOT financial correctness."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IngestionErrorCode(str, Enum):
    """Controlled error codes — safe messages, no raw parser exceptions."""

    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
    UNSUPPORTED_DOCUMENT = "UNSUPPORTED_DOCUMENT"
    UNREADABLE_DOCUMENT = "UNREADABLE_DOCUMENT"
    EMPTY_DOCUMENT = "EMPTY_DOCUMENT"
    AMBIGUOUS_DOCUMENT = "AMBIGUOUS_DOCUMENT"
    DUPLICATE_IMPORT = "DUPLICATE_IMPORT"
    IMPORT_NOT_FOUND = "IMPORT_NOT_FOUND"
    INVALID_STATUS = "INVALID_STATUS"
    ALREADY_APPLIED = "ALREADY_APPLIED"
    ALREADY_CANCELLED = "ALREADY_CANCELLED"
    STALE_PREVIEW = "STALE_PREVIEW"
    INVALID_CANDIDATE = "INVALID_CANDIDATE"
    INVALID_VALUE = "INVALID_VALUE"
    COMMIT_FAILED = "COMMIT_FAILED"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"


INGESTION_VERSION = "ingestion_v1"

# Hard caps — keep batches and payloads bounded.
MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_CANDIDATES_PER_BATCH = 2000
MAX_EXTRACTED_TEXT_CHARS = 500_000


SUPPORTED_MIME_TYPES = {
    "text/plain",
    "text/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",  # some clients label .csv this way
}

SUPPORTED_EXTENSIONS = {".txt", ".csv", ".pdf", ".docx"}


def batch_can_confirm(status: str) -> bool:
    return status in (
        ImportStatus.REVIEW_REQUIRED.value,
        ImportStatus.CONFIRMED.value,
    )


def batch_is_terminal(status: str) -> bool:
    return status in (
        ImportStatus.APPLIED.value,
        ImportStatus.PARTIALLY_APPLIED.value,
        ImportStatus.FAILED.value,
        ImportStatus.CANCELLED.value,
    )
