"""Normalized import contracts — the boundary between parsing and domain.

Extraction answers "what does the document literally contain?".
Normalization answers "which canonical FinArivu concept does it map to?".

Every extractor produces a ``NormalizedImport`` — fields (single values
like net pay), records (bank transactions, holdings) and warnings —
with provenance on each. The mapping layer then turns these into
``ImportCandidate`` rows against the existing financial models.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

from app.data_ingestion.types import (
    Confidence,
    DocumentType,
    TransactionClass,
    TransactionDirection,
)


@dataclass
class Provenance:
    """Where a value came from inside the source document."""

    source_type: str = "document"          # document | csv_row | pdf_page
    source_label: str = ""                 # e.g. "Net Pay", column name
    source_page: int | None = None         # 1-based PDF page
    source_row: int | None = None          # 1-based CSV/line row
    source_column: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "sourceType": self.source_type,
            "sourceLabel": self.source_label,
            "sourcePage": self.source_page,
            "sourceRow": self.source_row,
            "sourceColumn": self.source_column,
        }


@dataclass
class NormalizedField:
    """A single extracted+normalized scalar (e.g. net pay, EMI)."""

    key: str                      # canonical key, e.g. "net_pay", "emi"
    label: str                    # display label, e.g. "Net Pay"
    value: Any                    # Decimal | date | str | int
    raw: str = ""                 # literal text found in the document
    confidence: Confidence = Confidence.MEDIUM
    provenance: Provenance = field(default_factory=Provenance)


@dataclass
class NormalizedRecord:
    """A normalized record — bank transaction or investment holding.

    ``payload`` holds the canonical shape (date/amount/direction/… for
    bank txns; name/quantity/value/… for holdings) — the mapping layer
    turns it into ImportCandidate rows targeting the domain models.
    """

    kind: str                     # "transaction" | "holding"
    payload: dict[str, Any]
    txn_class: TransactionClass | None = None
    direction: TransactionDirection | None = None
    confidence: Confidence = Confidence.MEDIUM
    provenance: Provenance = field(default_factory=Provenance)


@dataclass
class NormalizedImport:
    """Uniform extractor output — one per document, regardless of source."""

    document_type: DocumentType
    period_start: date | None = None
    period_end: date | None = None
    fields: list[NormalizedField] = field(default_factory=list)
    records: list[NormalizedRecord] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)   # employer, lender…
    extracted_at: datetime | None = None
