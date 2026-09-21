"""Investment-statement extraction — READ-ONLY holdings data.

Extracts provider, statement date, and holdings (name, type, quantity,
invested amount, current value). Imported holdings feed assets/net
worth only — never buy/sell signals, rebalancing or trading.
"""

from __future__ import annotations

import re
from datetime import date

from app.data_ingestion.extractors.base import (
    DocumentExtractor,
    find_label_value,
    make_field,
    parse_amount,
    parse_date,
)
from app.data_ingestion.normalized import (
    NormalizedImport,
    NormalizedRecord,
    Provenance,
)
from app.data_ingestion.types import Confidence, DocumentType

# Canonical FinArivu AssetType mapping — unknown kinds become "Other".
_ASSET_TYPE_MAP = {
    "mutual fund": "Mutual Fund", "mf": "Mutual Fund", "sip": "Mutual Fund",
    "stock": "Stock", "equity": "Stock", "share": "Stock", "etf": "Stock",
    "fixed deposit": "Fixed Deposit", "fd": "Fixed Deposit",
    "ppf": "PPF", "epf": "EPF", "nps": "NPS",
    "gold": "Gold", "sgb": "Gold", "sovereign gold": "Gold",
    "property": "Property", "real estate": "Property",
    "cash": "Cash", "bank": "Bank", "crypto": "Crypto",
}

_CSV_HOLDING_HINTS = {"name", "instrument", "scheme", "holding", "security"}


class InvestmentStatementExtractor(DocumentExtractor):
    document_type = DocumentType.INVESTMENT_STATEMENT

    def extract(self, text, pages=None, csv_headers=None, csv_rows=None) -> NormalizedImport:
        result = NormalizedImport(document_type=self.document_type)
        joined = "\n".join(pages) if pages else text
        lines = self._lines(joined)

        # ── Provider / statement date ────────────────────────────────────
        hit = find_label_value(
            lines, ["provider", "fund house", "broker", "amc", "depository", "platform"]
        )
        if hit:
            _, rest, idx = hit
            value = re.sub(r"[^A-Za-z0-9 &.,'-]", "", rest).strip()
            if 2 <= len(value) <= 80:
                result.fields.append(
                    make_field("provider", "Provider", value, rest,
                               Confidence.MEDIUM)
                )
        hit = find_label_value(
            lines, ["statement date", "as on", "as of", "portfolio date"]
        )
        if hit:
            _, rest, idx = hit
            parsed = parse_date(rest)
            if parsed:
                result.fields.append(
                    make_field("statement_date", "Statement Date",
                               parsed.isoformat(), rest, Confidence.HIGH)
                )
                result.period_start = parsed
                result.period_end = parsed

        # ── Holdings ─────────────────────────────────────────────────────
        if csv_rows and csv_headers:
            self._extract_csv(csv_headers, csv_rows, result)
        if not result.records:
            self._extract_text(lines, result)

        if not result.records:
            result.warnings.append("No holdings could be identified.")
        return result

    # ── CSV holdings ─────────────────────────────────────────────────────

    def _extract_csv(self, headers: list[str], rows: list[list[str]],
                     out: NormalizedImport) -> None:
        cols = self._map_columns(headers)
        if "name" not in cols or "value" not in cols:
            return
        for row_idx, row in enumerate(rows, start=2):
            def cell(key: str) -> str:
                idx = cols.get(key)
                return row[idx].strip() if idx is not None and idx < len(row) else ""

            name = cell("name")
            value = parse_amount(cell("value"))
            if not name or value is None:
                continue
            out.records.append(
                NormalizedRecord(
                    kind="holding",
                    payload={
                        "name": name[:255],
                        "holding_type": cell("type") or None,
                        "quantity": str(parse_amount(cell("quantity")))
                        if cell("quantity") else None,
                        "invested_amount": str(parse_amount(cell("invested")))
                        if cell("invested") else None,
                        "current_value": str(value),
                    },
                    confidence=Confidence.HIGH,
                    provenance=Provenance(
                        source_type="csv_row", source_label="holding",
                        source_row=row_idx,
                    ),
                )
            )

    @staticmethod
    def _map_columns(headers: list[str]) -> dict[str, int]:
        cols: dict[str, int] = {}
        for idx, h in enumerate(headers):
            low = h.strip().lower()
            if low in _CSV_HOLDING_HINTS and "name" not in cols:
                cols["name"] = idx
            elif low in {"current value", "market value", "value", "amount"} and "value" not in cols:
                cols["value"] = idx
            elif low in {"quantity", "units", "units held", "qty"} and "quantity" not in cols:
                cols["quantity"] = idx
            elif low in {"invested", "invested amount", "cost", "cost value", "principal"} and "invested" not in cols:
                cols["invested"] = idx
            elif low in {"type", "asset type", "holding type", "category"} and "type" not in cols:
                cols["type"] = idx
        return cols

    # ── Text holdings ────────────────────────────────────────────────────

    def _extract_text(self, lines: list[str], out: NormalizedImport) -> None:
        """Lines like 'HDFC Balanced Fund  120.5 units  45,000' — the last
        amount on the line is treated as current value; a 'units/qty'
        marker picks the quantity."""
        skip_markers = (
            "statement", "folio", "account", "page", "total", "summary",
            "portfolio", "date", "provider", "customer", "pan",
        )
        for idx, line in enumerate(lines, start=1):
            low = line.lower()
            if any(m in low for m in skip_markers) and not re.search(r"\d", line):
                continue
            amounts = re.findall(r"[\d,]+\.\d{2}|[\d,]+", line)
            if len(amounts) < 1:
                continue
            value = parse_amount(amounts[-1])
            if value is None or value == 0:
                continue
            name = line[: line.rfind(amounts[-1])]
            qty = None
            qty_m = re.search(r"([\d,]+\.?\d*)\s*(units?|qty|shares?)", low)
            if qty_m:
                qty = parse_amount(qty_m.group(1))
                name = name.replace(qty_m.group(0), "")
            name = re.sub(r"[\d,]+\.?\d*", "", name).strip(" -–—:₹")
            if len(name) < 3 or not re.search(r"[a-zA-Z]", name):
                continue
            out.records.append(
                NormalizedRecord(
                    kind="holding",
                    payload={
                        "name": name[:255],
                        "holding_type": self._type_hint(low),
                        "quantity": str(qty) if qty else None,
                        "invested_amount": None,
                        "current_value": str(value),
                    },
                    confidence=Confidence.MEDIUM,
                    provenance=Provenance(
                        source_type="document", source_label="holding line",
                        source_row=idx,
                    ),
                )
            )

    @staticmethod
    def _type_hint(text: str) -> str | None:
        for keyword in _ASSET_TYPE_MAP:
            if keyword in text:
                return keyword
        return None


def map_holding_type_to_asset(holding_type: str | None, name: str = "") -> str:
    """Normalized holding type → canonical AssetType (deterministic)."""
    text = f"{holding_type or ''} {name}".lower()
    for keyword, canonical in _ASSET_TYPE_MAP.items():
        if keyword in text:
            return canonical
    return "Other"
