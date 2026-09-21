"""Shared extraction helpers — literal parsing only, no domain logic.

Amounts, dates and labelled lines are parsed here once so each document
extractor stays small and consistent. Nothing in this module knows about
FinArivu domain models — that mapping lives in ``mapping.py``.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from app.data_ingestion.normalized import (
    NormalizedField,
    NormalizedImport,
    Provenance,
)
from app.data_ingestion.types import Confidence, DocumentType


# ── Amount parsing ────────────────────────────────────────────────────────

_AMOUNT_RE = re.compile(r"-?\d[\d,]*\.?\d*")


def parse_amount(raw: str) -> Decimal | None:
    """Parse a money string like '₹ 92,000.00' or '92000' into Decimal."""
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    # Strip currency markers and parenthesised negatives.
    negative = text.startswith("(") and text.endswith(")") or text.startswith("-")
    text = re.sub(r"[₹$€£\s]|rs\.?|inr", "", text, flags=re.IGNORECASE)
    match = _AMOUNT_RE.search(text)
    if not match:
        return None
    try:
        value = Decimal(match.group(0).replace(",", ""))
    except InvalidOperation:
        return None
    return -abs(value) if negative else abs(value)


def find_amounts(text: str) -> list[Decimal]:
    """All plausible amounts in a text fragment."""
    return [
        v for v in (parse_amount(m) for m in re.findall(r"[₹]?\s*[\d,]+(?:\.\d+)?", text))
        if v is not None
    ]


# ── Date parsing ──────────────────────────────────────────────────────────

_DATE_PATTERNS = [
    "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d %b %Y", "%d %B %Y",
    "%d/%m/%y", "%d-%m-%y", "%d.%m.%Y", "%m/%d/%Y",
]
_MONTH_YEAR_RE = re.compile(
    r"\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|"
    r"dec(?:ember)?)[\s,]+(\d{4})\b",
    re.IGNORECASE,
)
_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}


def parse_date(raw: str) -> date | None:
    """Parse common Indian-document date formats; None when unparseable."""
    if not raw:
        return None
    text = str(raw).strip()
    for fmt in _DATE_PATTERNS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    m = _MONTH_YEAR_RE.search(text)
    if m:
        month = _MONTHS.get(m.group(1).lower()[:4]) or _MONTHS.get(
            m.group(1).lower()[:3]
        )
        if month:
            return date(int(m.group(2)), month, 1)
    return None


def parse_month_year(raw: str) -> date | None:
    """Parse 'September 2026' / 'Sep 2026' / '09/2026' into first-of-month."""
    if not raw:
        return None
    text = str(raw).strip()
    m = _MONTH_YEAR_RE.search(text)
    if m:
        month = _MONTHS.get(m.group(1).lower()[:4]) or _MONTHS.get(
            m.group(1).lower()[:3]
        )
        if month:
            return date(int(m.group(2)), month, 1)
    m = re.search(r"\b(\d{1,2})[/\-.](\d{4})\b", text)
    if m and 1 <= int(m.group(1)) <= 12:
        return date(int(m.group(2)), int(m.group(1)), 1)
    return None


# ── Labelled-line helpers ────────────────────────────────────────────────

def find_label_value(
    lines: list[str], labels: list[str]
) -> tuple[str, str, int] | None:
    """Return (label_matched, remainder_of_line, line_index) for the first
    line containing any label — used for 'Net Pay    92,000' style rows."""
    for idx, line in enumerate(lines):
        low = line.lower()
        for label in labels:
            pos = low.find(label)
            if pos == -1:
                continue
            rest = line[pos + len(label):].strip(" \t:-–—₹")
            if rest:
                return label, rest, idx
    return None


def labelled_amount(
    lines: list[str], labels: list[str]
) -> tuple[Decimal, str, int] | None:
    """Find a labelled line and parse the first amount on it."""
    hit = find_label_value(lines, labels)
    if hit is None:
        return None
    label, rest, idx = hit
    amounts = find_amounts(rest)
    if not amounts:
        # Try the next line — some PDFs split label/value across lines.
        if idx + 1 < len(lines):
            amounts = find_amounts(lines[idx + 1])
    if not amounts:
        return None
    return amounts[0], label, idx


def make_field(
    key: str,
    label: str,
    value,
    raw: str,
    confidence: Confidence,
    *,
    page: int | None = None,
    row: int | None = None,
    column: str | None = None,
) -> NormalizedField:
    return NormalizedField(
        key=key,
        label=label,
        value=value,
        raw=raw,
        confidence=confidence,
        provenance=Provenance(
            source_type="pdf_page" if page else ("csv_row" if row else "document"),
            source_label=label,
            source_page=page,
            source_row=row,
            source_column=column,
        ),
    )


class DocumentExtractor:
    """Base class — each subclass handles one DocumentType."""

    document_type: DocumentType

    def extract(self, text: str, pages: list[str] | None = None,
                csv_headers: list[str] | None = None,
                csv_rows: list[list[str]] | None = None) -> NormalizedImport:
        raise NotImplementedError

    @staticmethod
    def _lines(text: str) -> list[str]:
        return [ln.strip() for ln in text.splitlines() if ln.strip()]
