"""Document extractors — one per supported DocumentType."""

from __future__ import annotations

from app.data_ingestion.extractors.bank_statement import BankStatementExtractor
from app.data_ingestion.extractors.investment_statement import (
    InvestmentStatementExtractor,
)
from app.data_ingestion.extractors.loan_statement import LoanStatementExtractor
from app.data_ingestion.extractors.payslip import PayslipExtractor
from app.data_ingestion.types import DocumentType

EXTRACTORS = {
    DocumentType.PAYSLIP: PayslipExtractor,
    DocumentType.BANK_STATEMENT: BankStatementExtractor,
    DocumentType.LOAN_STATEMENT: LoanStatementExtractor,
    DocumentType.INVESTMENT_STATEMENT: InvestmentStatementExtractor,
}

__all__ = ["EXTRACTORS"]
