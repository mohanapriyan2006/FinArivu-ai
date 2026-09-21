"""File bytes → text extraction.

Supports only what the installed environment can reliably parse:
``.txt``, ``.csv`` (stdlib), ``.pdf`` (pypdf), ``.docx`` (python-docx).
XLSX / images are rejected with UNSUPPORTED_FORMAT — no fabricated OCR.

The extracted text is used in-memory only; raw bytes are never stored.
"""

from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field

from app.data_ingestion.errors import IngestionError
from app.data_ingestion.types import (
    MAX_EXTRACTED_TEXT_CHARS,
    MAX_FILE_SIZE,
    SUPPORTED_EXTENSIONS,
)


@dataclass
class ExtractedDocument:
    """Raw extraction output — text plus optional CSV rows for provenance."""

    text: str
    pages: list[str] = field(default_factory=list)
    csv_rows: list[list[str]] = field(default_factory=list)
    csv_headers: list[str] = field(default_factory=list)
    is_csv: bool = False


def _decode_text(content: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return content.decode(encoding)
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise IngestionError.unreadable("The file could not be decoded as text.")


def _extract_csv(text: str) -> tuple[list[str], list[list[str]]]:
    """Parse CSV text into (headers, rows). Returns ([], []) if not CSV."""
    sample = text.strip()
    if not sample:
        return [], []
    try:
        dialect = csv.Sniffer().sniff(sample[:4096], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    try:
        rows = [
            [cell.strip() for cell in row]
            for row in csv.reader(io.StringIO(text), dialect)
            if any(cell.strip() for cell in row)
        ]
    except csv.Error:
        return [], []
    if len(rows) < 2:
        return [], []
    return rows[0], rows[1:]


def _extract_pdf(content: bytes) -> ExtractedDocument:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception:
        raise IngestionError.unreadable(
            "This PDF could not be read. It may be scanned or protected."
        )
    return ExtractedDocument(text="\n".join(pages), pages=pages)


def _extract_docx(content: bytes) -> ExtractedDocument:
    try:
        from docx import Document

        document = Document(io.BytesIO(content))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    except Exception:
        raise IngestionError.unreadable("This DOCX file could not be read.")
    return ExtractedDocument(text=text)


def extract_document(
    content: bytes, file_name: str, mime_type: str | None = None
) -> ExtractedDocument:
    """Convert uploaded bytes into an ExtractedDocument.

    Raises ``IngestionError`` (UNSUPPORTED_FORMAT / UNREADABLE_DOCUMENT /
    EMPTY_DOCUMENT / FILE_TOO_LARGE) — never raw parser exceptions.
    """
    if len(content) > MAX_FILE_SIZE:
        raise IngestionError.file_too_large()

    lower_name = (file_name or "").lower()
    ext = "." + lower_name.rsplit(".", 1)[-1] if "." in lower_name else ""

    # Prefer extension; fall back to MIME; sniff CSV/TXT content last.
    is_csv_ext = ext == ".csv" or (mime_type or "") == "text/csv"

    if ext == ".pdf" or mime_type == "application/pdf":
        doc = _extract_pdf(content)
    elif ext == ".docx" or (
        mime_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        doc = _extract_docx(content)
    elif ext in SUPPORTED_EXTENSIONS or is_csv_ext or (
        mime_type in (None, "", "text/plain", "text/csv", "application/octet-stream")
    ):
        text = _decode_text(content)
        headers, rows = _extract_csv(text) if is_csv_ext or ext == ".csv" else ([], [])
        doc = ExtractedDocument(
            text=text,
            csv_headers=headers,
            csv_rows=rows,
            is_csv=bool(rows),
        )
    else:
        raise IngestionError.unsupported_format()

    doc.text = doc.text[:MAX_EXTRACTED_TEXT_CHARS]
    if not doc.text.strip() and not doc.csv_rows:
        raise IngestionError.empty_document()

    # A .txt that is actually CSV content — sniff it.
    if not doc.is_csv and not doc.pages:
        headers, rows = _extract_csv(doc.text)
        if headers and rows:
            doc.is_csv = True
            doc.csv_headers, doc.csv_rows = headers, rows

    return doc
