"""Deterministic document-type detection.

Scores the extracted text against per-type keyword signals. The highest
score wins only when it clears a minimum margin over the runner-up —
otherwise the document is AMBIGUOUS and the user picks the type. Nothing
is ever guessed silently.
"""

from __future__ import annotations

import re

from app.data_ingestion.extraction import ExtractedDocument
from app.data_ingestion.types import DocumentType

# Signal sets — each regex hit adds weight. Weight reflects how
# discriminative the signal is (a bare "statement" means little;
# "net pay" or "outstanding principal" mean a lot).
_SIGNALS: dict[DocumentType, list[tuple[str, int]]] = {
    DocumentType.PAYSLIP: [
        (r"\bpayslip\b|\bpay\s*slip\b|\bsalary\s+slip\b", 6),
        (r"\bnet\s+pay\b|\bnet\s+salary\b|\btake[\s-]?home\b", 5),
        (r"\bgross\s+(pay|salary|earnings|income)\b", 4),
        (r"\bbasic\s+(pay|salary)\b", 3),
        (r"\b(epf|provident\s+fund|pf\s+deduction)\b", 3),
        (r"\b(employer|employee\s+(name|id|code)|pay\s+period)\b", 3),
        (r"\b(allowances?|deductions?|tds|income\s+tax\s+deducted)\b", 2),
        (r"\b(hra|house\s+rent\s+allowance|dearness)\b", 2),
    ],
    DocumentType.BANK_STATEMENT: [
        (r"\b(account\s+(statement|number|no\.?)|stmt)\b", 4),
        (r"\b(opening|closing)\s+balance\b", 5),
        (r"\b(debit|credit)\b.{0,30}\b(balance|amount)\b", 3),
        (r"\b(transaction|narration|particulars)\b", 3),
        (r"\b(upi|neft|imps|rtgs|atm|pos)\b", 2),
        (r"\b(withdrawal|deposit|cr\b|dr\b)", 2),
    ],
    DocumentType.LOAN_STATEMENT: [
        (r"\bloan\b", 3),
        (r"\b(outstanding\s+principal|principal\s+outstanding)\b", 6),
        (r"\b(emi|equated\s+monthly\s+instal)\b", 5),
        (r"\binterest\s+rate\b", 4),
        (r"\b(tenure|tenor|maturity\s+date|sanction)\b", 3),
        (r"\b(lender|borrower|disburs)\b", 3),
    ],
    DocumentType.INVESTMENT_STATEMENT: [
        (r"\b(portfolio|holdings?|folio)\b", 5),
        (r"\b(mutual\s+fund|nav\b|units?\s+held)\b", 4),
        (r"\b(demat|isin|scheme\s+name|sip\b)\b", 3),
        (r"\b(invested|current\s+value|market\s+value)\b", 3),
        (r"\b(shares?|equity|etf|bonds?)\b", 2),
    ],
}

# CSV headers that strongly indicate a bank statement.
_CSV_BANK_HEADERS = {
    "date", "description", "narration", "particulars", "debit", "credit",
    "amount", "balance", "reference", "ref no", "withdrawal", "deposit",
    "type", "dr/cr", "txn date", "value date",
}

_MIN_SCORE = 6
_MIN_MARGIN = 3


def detect_document_type(
    doc: ExtractedDocument,
    declared: DocumentType | None = None,
) -> tuple[DocumentType | None, dict[str, int]]:
    """Return (detected_type, scores). ``None`` when ambiguous.

    ``declared`` short-circuits detection — the user explicitly chose a
    type at upload time.
    """
    if declared is not None:
        return declared, {declared.value: 99}

    text = doc.text.lower()
    scores: dict[str, int] = {t.value: 0 for t in DocumentType}
    for doc_type, signals in _SIGNALS.items():
        for pattern, weight in signals:
            if re.search(pattern, text):
                scores[doc_type.value] += weight

    # CSV structure is a strong bank-statement signal on its own.
    if doc.is_csv:
        headers = {h.strip().lower() for h in doc.csv_headers}
        overlap = len(headers & _CSV_BANK_HEADERS)
        scores[DocumentType.BANK_STATEMENT.value] += 2 * overlap
        if {"date"} & headers and ({"debit", "credit"} & headers or "amount" in headers):
            scores[DocumentType.BANK_STATEMENT.value] += 6
        if {"units", "nav"} & headers or {"quantity", "current value"} & headers:
            scores[DocumentType.INVESTMENT_STATEMENT.value] += 6

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    best_type, best = ranked[0]
    second = ranked[1][1] if len(ranked) > 1 else 0
    if best < _MIN_SCORE or (best - second) < _MIN_MARGIN:
        return None, scores
    return DocumentType(best_type), scores
