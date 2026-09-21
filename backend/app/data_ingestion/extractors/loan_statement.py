"""Loan-statement extraction — literal fields → canonical keys.

Extracts lender, loan type, outstanding principal, EMI, interest rate,
tenure remaining, maturity date, statement date. Only fields the
``liabilities`` model actually supports become candidates later; the
rest stay as extracted metadata.
"""

from __future__ import annotations

import re
from datetime import date

from app.data_ingestion.extractors.base import (
    DocumentExtractor,
    find_label_value,
    labelled_amount,
    make_field,
    parse_amount,
    parse_date,
)
from app.data_ingestion.normalized import NormalizedImport
from app.data_ingestion.types import Confidence, DocumentType


class LoanStatementExtractor(DocumentExtractor):
    document_type = DocumentType.LOAN_STATEMENT

    def extract(self, text, pages=None, csv_headers=None, csv_rows=None) -> NormalizedImport:
        result = NormalizedImport(document_type=self.document_type)
        joined = "\n".join(pages) if pages else text
        lines = self._lines(joined)
        page_of = self._page_of(lines, pages) if pages else {}

        # ── Scalar labelled fields ────────────────────────────────────────
        for labels, key, label, conf in (
            (["outstanding principal", "principal outstanding", "outstanding balance", "principal balance", "loan outstanding"], "principal_outstanding", "Outstanding Principal", Confidence.HIGH),
            (["emi", "equated monthly instal", "monthly instalment", "monthly installment"], "emi", "EMI", Confidence.HIGH),
            (["interest rate", "rate of interest", "roi"], "interest_rate", "Interest Rate", Confidence.HIGH),
            (["remaining tenure", "tenure remaining", "balance tenure", "remaining instalments", "remaining installments"], "tenure_remaining_months", "Remaining Tenure (months)", Confidence.MEDIUM),
            (["total tenure", "loan tenure", "tenor"], "tenure_months", "Tenure (months)", Confidence.LOW),
            (["sanctioned amount", "sanction amount", "loan amount", "principal amount"], "sanctioned_amount", "Sanctioned Amount", Confidence.LOW),
        ):
            hit = labelled_amount(lines, list(labels))
            if hit:
                amount, matched, idx = hit
                result.fields.append(
                    make_field(key, label, str(amount), matched, conf,
                               page=page_of.get(idx))
                )

        # ── Dates ─────────────────────────────────────────────────────────
        for labels, key, label in (
            (["maturity date", "maturity"], "maturity_date", "Maturity Date"),
            (["statement date", "as on", "as of"], "statement_date", "Statement Date"),
            (["start date", "disbursement date", "disbursal date"], "start_date", "Start Date"),
        ):
            hit = find_label_value(lines, list(labels))
            if hit:
                _, rest, idx = hit
                parsed = parse_date(rest)
                if parsed:
                    result.fields.append(
                        make_field(key, label, parsed.isoformat(), rest,
                                   Confidence.HIGH, page=page_of.get(idx))
                    )

        # ── Text fields ───────────────────────────────────────────────────
        for labels, key, label in (
            (["lender", "bank name", "financier", "nbfc"], "lender", "Lender"),
            (["account number", "loan account", "account no", "loan a/c"], "account_reference", "Account Reference"),
            (["borrower", "customer name", "applicant"], "borrower", "Borrower"),
        ):
            hit = find_label_value(lines, list(labels))
            if hit:
                _, rest, idx = hit
                value = re.sub(r"[^A-Za-z0-9 &.,'/*-]", "", rest).strip()
                if 1 <= len(value) <= 120:
                    result.fields.append(
                        make_field(key, label, value, rest, Confidence.MEDIUM,
                                   page=page_of.get(idx))
                    )

        # ── Loan-type keyword → canonical LIABILITY_TYPES value ──────────
        low = joined.lower()
        for keyword, canonical in (
            ("home loan", "Home Loan"), ("housing loan", "Home Loan"),
            ("car loan", "Car Loan"), ("auto loan", "Car Loan"),
            ("vehicle loan", "Car Loan"), ("personal loan", "Personal Loan"),
            ("education loan", "Education Loan"), ("medical loan", "Medical Loan"),
            ("credit card", "Credit Card"),
        ):
            if keyword in low:
                result.meta["loan_type"] = canonical
                break

        for f in result.fields:
            if f.key == "maturity_date":
                result.period_end = date.fromisoformat(f.value)
            if f.key == "statement_date":
                result.period_start = date.fromisoformat(f.value)

        if "principal_outstanding" not in {f.key for f in result.fields}:
            result.warnings.append("No outstanding principal figure was identified.")
        return result

    @staticmethod
    def _page_of(lines: list[str], pages: list[str]) -> dict[int, int]:
        """Best-effort map of line index → 1-based PDF page."""
        out: dict[int, int] = {}
        cursor = 0
        for page_no, page_text in enumerate(pages, start=1):
            page_lines = [ln.strip() for ln in page_text.splitlines() if ln.strip()]
            for i, ln in enumerate(page_lines):
                if cursor + i < len(lines) and lines[cursor + i] == ln:
                    out[cursor + i] = page_no
            cursor += len(page_lines)
        return out
