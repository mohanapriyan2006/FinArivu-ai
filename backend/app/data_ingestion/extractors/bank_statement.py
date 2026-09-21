"""Bank-statement extraction — transactions with direction + classification.

Two deterministic paths:

* CSV — header-driven column mapping (date/description/debit/credit/
  amount/balance/reference). Provenance is row+column accurate.
* Text — lines matching ``<date> … <amount> [Dr|Cr]`` patterns.

Classification is keyword-based and conservative: salary credits →
INCOME, explicit self/internal transfers → TRANSFER, debits → EXPENSE,
anything unclear → UNKNOWN (must be reviewed — never a guessed category).
"""

from __future__ import annotations

import re
from datetime import date
from decimal import Decimal

from app.data_ingestion.extractors.base import (
    DocumentExtractor,
    parse_amount,
    parse_date,
)
from app.data_ingestion.normalized import (
    NormalizedImport,
    NormalizedRecord,
    Provenance,
)
from app.data_ingestion.types import (
    Confidence,
    DocumentType,
    TransactionClass,
    TransactionDirection,
)

_SALARY_RE = re.compile(
    r"\b(salary|sal\b|payroll|wages?|stipend|employer|ctc)\b", re.IGNORECASE
)
_TRANSFER_RE = re.compile(
    r"\b(self|own\s+account|internal\s+transfer|transfer\s+to\s+self|"
    r"between\s+own|sweep|auto\s*sweep)\b",
    re.IGNORECASE,
)
_ATM_CASH_RE = re.compile(r"\b(atm|cash\s+wdr|cash\s+withdrawal|cwdr)\b", re.IGNORECASE)
_INTEREST_RE = re.compile(
    r"\b(interest|int\.?\s*pd|dividend|cashback|refund|reversal|reimb)\b",
    re.IGNORECASE,
)
_DATE_LINE_RE = re.compile(
    r"^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w{3}\s+\d{2,4})\s+"
)

_HEADER_ALIASES: dict[str, set[str]] = {
    "date": {"date", "txn date", "transaction date", "value date", "posted date", "posting date"},
    "description": {"description", "narration", "particulars", "details", "remarks", "transaction details"},
    "debit": {"debit", "withdrawal", "withdrawals", "dr", "debit amount", "withdrawal amt"},
    "credit": {"credit", "deposit", "deposits", "cr", "credit amount", "deposit amt"},
    "amount": {"amount", "txn amount", "transaction amount"},
    "balance": {"balance", "closing balance", "running balance", "available balance", "bal"},
    "reference": {"reference", "ref no", "ref no.", "cheque no", "chq no", "utr", "txn id", "transaction id"},
    "direction": {"dr/cr", "type", "cr/dr", "d/c", "txn type", "transaction type"},
}

MAX_TEXT_TRANSACTIONS = 2000


class BankStatementExtractor(DocumentExtractor):
    document_type = DocumentType.BANK_STATEMENT

    def extract(self, text, pages=None, csv_headers=None, csv_rows=None) -> NormalizedImport:
        result = NormalizedImport(document_type=self.document_type)
        if csv_rows and csv_headers:
            self._extract_csv(csv_headers, csv_rows, result)
        if not result.records:
            joined = "\n".join(pages) if pages else text
            self._extract_text(joined, bool(pages), result)
        self._derive_period(result)
        self._classify(result)
        return result

    # ── CSV path ─────────────────────────────────────────────────────────

    def _extract_csv(self, headers: list[str], rows: list[list[str]],
                     out: NormalizedImport) -> None:
        cols = self._map_columns(headers)
        if "date" not in cols or not ({"debit", "credit", "amount"} & set(cols)):
            out.warnings.append("CSV columns did not match a bank statement layout.")
            return
        for row_idx, row in enumerate(rows[:MAX_TEXT_TRANSACTIONS], start=2):
            rec = self._csv_row_to_record(row_idx, row, cols)
            if rec is not None:
                out.records.append(rec)

    @staticmethod
    def _map_columns(headers: list[str]) -> dict[str, int]:
        cols: dict[str, int] = {}
        for idx, header in enumerate(headers):
            low = header.strip().lower()
            for canonical, aliases in _HEADER_ALIASES.items():
                if low in aliases and canonical not in cols:
                    cols[canonical] = idx
        return cols

    def _csv_row_to_record(
        self, row_idx: int, row: list[str], cols: dict[str, int]
    ) -> NormalizedRecord | None:
        def cell(key: str) -> str:
            idx = cols.get(key)
            return row[idx].strip() if idx is not None and idx < len(row) else ""

        txn_date = parse_date(cell("date"))
        if txn_date is None:
            return None  # not a transaction row — headers/totals/etc.
        description = cell("description") or "Bank transaction"
        debit = parse_amount(cell("debit")) if "debit" in cols else None
        credit = parse_amount(cell("credit")) if "credit" in cols else None
        amount_raw = parse_amount(cell("amount")) if "amount" in cols else None
        direction_marker = cell("direction").lower()
        balance = parse_amount(cell("balance")) if "balance" in cols else None
        reference = cell("reference")

        direction: TransactionDirection | None = None
        amount: Decimal | None = None
        if debit is not None and debit != 0:
            direction, amount = TransactionDirection.DEBIT, abs(debit)
        elif credit is not None and credit != 0:
            direction, amount = TransactionDirection.CREDIT, abs(credit)
        elif amount_raw is not None:
            amount = abs(amount_raw)
            if amount_raw < 0 or direction_marker.startswith("dr") or direction_marker.startswith("d") or "debit" in direction_marker:
                direction = TransactionDirection.DEBIT
            elif direction_marker.startswith("cr") or direction_marker.startswith("c") or "credit" in direction_marker:
                direction = TransactionDirection.CREDIT

        if amount is None or amount == 0:
            return None

        return NormalizedRecord(
            kind="transaction",
            payload={
                "date": txn_date.isoformat(),
                "description": description[:255],
                "amount": str(amount),
                "direction": direction.value if direction else None,
                "reference": reference[:120] or None,
                "balance": str(balance) if balance is not None else None,
                "currency": "INR",
            },
            direction=direction,
            confidence=Confidence.HIGH,
            provenance=Provenance(
                source_type="csv_row", source_label="transaction",
                source_row=row_idx,
                source_column=";".join(sorted(cols)),
            ),
        )

    # ── Text path ────────────────────────────────────────────────────────

    def _extract_text(self, text: str, has_pages: bool, out: NormalizedImport) -> None:
        """Parse ``<date> <description> <amount> [Dr|Cr]`` lines."""
        for idx, line in enumerate(self._lines(text), start=1):
            if len(out.records) >= MAX_TEXT_TRANSACTIONS:
                break
            m = _DATE_LINE_RE.match(line)
            if not m:
                continue
            txn_date = parse_date(m.group(1))
            if txn_date is None:
                continue
            rest = line[m.end():].strip()
            direction = None
            dir_m = re.search(r"\b(dr|cr|debit|credit)\b\.?$", rest, re.IGNORECASE)
            if dir_m:
                token = dir_m.group(1).lower()
                direction = (
                    TransactionDirection.DEBIT if token.startswith("d") else TransactionDirection.CREDIT
                )
                rest = rest[: dir_m.start()].strip()
            amounts = re.findall(r"[\d,]+\.\d{2}|₹\s*[\d,]+(?:\.\d{2})?", rest)
            if not amounts:
                continue
            amount = parse_amount(amounts[-1])
            if amount is None or amount == 0:
                continue
            description = rest[: rest.rfind(amounts[-1])].strip(" -–—") or "Bank transaction"

            out.records.append(
                NormalizedRecord(
                    kind="transaction",
                    payload={
                        "date": txn_date.isoformat(),
                        "description": description[:255],
                        "amount": str(abs(amount)),
                        "direction": direction.value if direction else None,
                        "reference": None,
                        "balance": None,
                        "currency": "INR",
                    },
                    direction=direction,
                    confidence=Confidence.MEDIUM,
                    provenance=Provenance(
                        source_type="pdf_page" if has_pages else "document",
                        source_label="transaction line",
                        source_row=idx,
                    ),
                )
            )

    # ── Period + classification ──────────────────────────────────────────

    @staticmethod
    def _derive_period(out: NormalizedImport) -> None:
        dates = [
            date.fromisoformat(r.payload["date"])
            for r in out.records
            if r.payload.get("date")
        ]
        if dates:
            out.period_start = min(dates)
            out.period_end = max(dates)

    @staticmethod
    def _classify(out: NormalizedImport) -> None:
        """Deterministic classification — never a guessed category."""
        for rec in out.records:
            desc = rec.payload.get("description", "")
            direction = rec.direction
            if _TRANSFER_RE.search(desc):
                rec.txn_class = TransactionClass.TRANSFER
            elif direction == TransactionDirection.CREDIT:
                if _SALARY_RE.search(desc):
                    rec.txn_class = TransactionClass.INCOME
                    rec.payload["income_source"] = "Salary"
                elif _INTEREST_RE.search(desc):
                    rec.txn_class = TransactionClass.INCOME
                    rec.payload["income_source"] = "Interest"
                else:
                    rec.txn_class = TransactionClass.INCOME
                    rec.payload["income_source"] = "Other"
            elif direction == TransactionDirection.DEBIT:
                rec.txn_class = (
                    TransactionClass.UNKNOWN
                    if _ATM_CASH_RE.search(desc)
                    else TransactionClass.EXPENSE
                )
            else:
                rec.txn_class = TransactionClass.UNKNOWN
