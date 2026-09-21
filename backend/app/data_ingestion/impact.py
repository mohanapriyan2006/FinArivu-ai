"""Authoritative document-type → affected-domain map.

Used for the recalculation summary — only domains actually touched by
applied candidates are reported, intersected with this map.
"""

from __future__ import annotations

from app.data_ingestion.types import DocumentType

DOCUMENT_IMPACT: dict[DocumentType, set[str]] = {
    DocumentType.PAYSLIP: {
        "income", "cash_flow", "tax", "goals", "retirement", "health",
    },
    DocumentType.BANK_STATEMENT: {
        "expenses", "income", "cash_flow", "budgets", "goals", "health",
    },
    DocumentType.LOAN_STATEMENT: {
        "liabilities", "cash_flow", "net_worth", "health",
    },
    DocumentType.INVESTMENT_STATEMENT: {
        "assets", "net_worth", "health",
    },
}

# Candidate target_domain → reporting domain.
DOMAIN_ALIASES: dict[str, str] = {
    "income": "income",
    "tax": "tax",
    "expenses": "expenses",
    "liability": "liabilities",
    "asset": "assets",
    "transfer": "cash_flow",
}


def affected_domains(
    document_type: DocumentType, applied_domains: set[str]
) -> list[str]:
    """Deterministic recalculation summary for an applied import."""
    mapped = {DOMAIN_ALIASES.get(d, d) for d in applied_domains}
    return sorted(DOCUMENT_IMPACT.get(document_type, set()) & mapped)
