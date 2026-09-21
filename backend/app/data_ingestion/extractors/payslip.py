"""Payslip extraction — literal fields only, canonical keys.

Extracts: employer, pay period, gross, basic, net pay, EPF, tax deducted,
total allowances/deductions. Fields without a matching FinArivu model
column are preserved as extracted metadata — never forced into financial
calculations.
"""

from __future__ import annotations

import re
from datetime import date, timedelta

from app.data_ingestion.extractors.base import (
    DocumentExtractor,
    find_label_value,
    labelled_amount,
    make_field,
    parse_month_year,
)
from app.data_ingestion.normalized import NormalizedImport
from app.data_ingestion.types import Confidence, DocumentType


class PayslipExtractor(DocumentExtractor):
    document_type = DocumentType.PAYSLIP

    def extract(self, text, pages=None, csv_headers=None, csv_rows=None) -> NormalizedImport:
        result = NormalizedImport(document_type=self.document_type)
        if pages:
            for page_no, page_text in enumerate(pages, start=1):
                self._extract_page(page_text, page_no, result)
        else:
            self._extract_page(text, None, result)
        self._dedupe_fields(result)
        self._derive_period(result)
        if not any(f.key in ("net_pay", "gross_income") for f in result.fields):
            result.warnings.append(
                "No gross or net pay figure could be identified."
            )
        return result

    # ── internals ────────────────────────────────────────────────────────

    def _extract_page(self, text: str, page: int | None, out: NormalizedImport) -> None:
        lines = self._lines(text)

        hit = find_label_value(lines, ["employer", "company name", "organisation", "organization"])
        if hit and "employer" not in {f.key for f in out.fields}:
            _, rest, idx = hit
            employer = re.sub(r"[^A-Za-z0-9 &.,'-]", "", rest).strip()
            if 2 <= len(employer) <= 80:
                out.fields.append(
                    make_field("employer", "Employer", employer, rest,
                               Confidence.MEDIUM, page=page)
                )

        for labels, key, label in (
            (["pay period", "salary month", "payslip for", "month of"], "pay_period", "Pay Period"),
        ):
            hit = find_label_value(lines, labels)
            if hit and key not in {f.key for f in out.fields}:
                _, rest, idx = hit
                parsed = parse_month_year(rest)
                if parsed:
                    out.fields.append(
                        make_field(key, label, parsed.isoformat(), rest,
                                   Confidence.HIGH, page=page)
                    )

        for labels, key, label, conf in (
            (["gross salary", "gross pay", "gross earnings", "gross income", "total earnings"], "gross_income", "Gross Income", Confidence.HIGH),
            (["net pay", "net salary", "take home", "net amount", "net payable"], "net_pay", "Net Pay", Confidence.HIGH),
            (["basic salary", "basic pay", "basic"], "basic_salary", "Basic Salary", Confidence.MEDIUM),
            (["epf", "provident fund", "pf deduction", "employee pf"], "epf", "EPF Contribution", Confidence.MEDIUM),
            (["income tax", "tax deducted", "tds", "professional tax"], "tax_deducted", "Tax Deducted", Confidence.MEDIUM),
            (["total deductions", "total deduction"], "total_deductions", "Total Deductions", Confidence.LOW),
            (["total allowances", "total allowance"], "total_allowances", "Total Allowances", Confidence.LOW),
        ):
            if key in {f.key for f in out.fields}:
                continue
            hit = labelled_amount(lines, list(labels))
            if hit:
                amount, matched, idx = hit
                out.fields.append(
                    make_field(key, label, str(amount), matched, conf, page=page)
                )

    @staticmethod
    def _dedupe_fields(out: NormalizedImport) -> None:
        seen: set[str] = set()
        unique = []
        for f in out.fields:
            if f.key in seen:
                continue
            seen.add(f.key)
            unique.append(f)
        out.fields = unique

    @staticmethod
    def _derive_period(out: NormalizedImport) -> None:
        for f in out.fields:
            if f.key != "pay_period":
                continue
            try:
                parsed = date.fromisoformat(str(f.value))
            except ValueError:
                parsed = parse_month_year(str(f.value))
            if parsed:
                out.period_start = parsed
                if parsed.month == 12:
                    out.period_end = date(parsed.year, 12, 31)
                else:
                    nxt = date(parsed.year, parsed.month + 1, 1)
                    out.period_end = nxt - timedelta(days=1)
            return
