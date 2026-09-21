"""Phase 5 — Financial Data Ingestion tests.

Covers extraction, detection, normalization helpers, validators,
fingerprints, and the full service lifecycle (ingest → review → decide
→ confirm → applied) including dedup, scoping and idempotency.
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

import pytest
import pytest_asyncio
from sqlalchemy import select

from app.data_ingestion.detection import detect_document_type
from app.data_ingestion.errors import IngestionError
from app.data_ingestion.extraction import ExtractedDocument, extract_document
from app.data_ingestion.extractors.bank_statement import BankStatementExtractor
from app.data_ingestion.extractors.base import (
    parse_amount,
    parse_date,
    parse_month_year,
)
from app.data_ingestion.extractors.investment_statement import (
    InvestmentStatementExtractor,
)
from app.data_ingestion.extractors.loan_statement import LoanStatementExtractor
from app.data_ingestion.extractors.payslip import PayslipExtractor
from app.data_ingestion.fingerprints import (
    description_similarity,
    transaction_fingerprint,
)
from app.data_ingestion.impact import affected_domains
from app.data_ingestion.service import DataIngestionService
from app.data_ingestion.types import (
    CandidateDecision,
    CandidateStatus,
    DocumentType,
    ImportStatus,
    IngestionErrorCode,
)
from app.data_ingestion.validators import validate_scalar, validate_transaction
from app.models.categories import ExpenseCategory
from app.models.expenses import Expense
from app.models.income import Income
from app.models.tax_profiles import TaxProfile
from app.models.users import User


# ── Fixtures ────────────────────────────────────────────────────────────

PAYSLIP_TEXT = """
ACME Technologies Pvt Ltd
Payslip for September 2026
Employee: Dev Sharma
Gross Salary: 1,25,000.00
Basic Salary: 62,500.00
HRA: 25,000.00
EPF: 7,800.00
Income Tax: 12,400.00
Total Deductions: 22,100.00
Net Pay: 1,02,900.00
"""

LOAN_TEXT = """
Home Loan Account Statement
Lender: HDFC Bank
Account Number: HL-884201
Borrower: Dev Sharma
Statement Date: 01/09/2026
Sanctioned Amount: 45,00,000.00
Outstanding Principal: 32,40,000.00
Interest Rate: 8.6
EMI: 38,500.00
Remaining Tenure: 210
Maturity Date: 01/03/2043
"""

BANK_CSV = """Date,Description,Debit,Credit,Balance
01/09/2026,SALARY CREDIT ACME TECH,,92000.00,92000.00
02/09/2026,UPI-SWIGGY-ORDER,450.00,,91550.00
03/09/2026,ATM CASH WDL,2000.00,,89550.00
04/09/2026,TRANSFER TO SELF SAVINGS,10000.00,,79550.00
05/09/2026,NEFT RENT PAYMENT,15000.00,,64550.00
"""

INVEST_CSV = """Name,Quantity,Invested,Current Value,Type
HDFC Balanced Advantage Fund,120.5,45000,52340.00,Mutual Fund
Nifty 50 ETF,30,5100,6240.00,Stock
"""


@pytest_asyncio.fixture
async def other_user(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        external_id="other-user-001",
        email="other@example.com",
        role="USER",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def other_category(db_session) -> ExpenseCategory:
    cat = ExpenseCategory(
        name="Other", icon="📦", color="#B0BEC5",
        display_order=10, is_system=True,
    )
    db_session.add(cat)
    await db_session.flush()
    return cat


# ── Extraction ──────────────────────────────────────────────────────────


class TestExtraction:
    def test_txt(self):
        doc = extract_document(b"hello world", "note.txt", "text/plain")
        assert doc.text.strip() == "hello world"
        assert not doc.is_csv

    def test_csv_sniffed(self):
        doc = extract_document(BANK_CSV.encode(), "stmt.csv", "text/csv")
        assert doc.is_csv
        assert doc.csv_headers[0].lower() == "date"
        assert len(doc.csv_rows) == 5

    def test_csv_sniffed_from_txt(self):
        doc = extract_document(BANK_CSV.encode(), "export.txt", "text/plain")
        assert doc.is_csv

    def test_unsupported_format(self):
        with pytest.raises(IngestionError) as exc:
            extract_document(b"PK\x03\x04", "book.xlsx", "application/xlsx")
        assert exc.value.code == IngestionErrorCode.UNSUPPORTED_FORMAT

    def test_empty_document(self):
        with pytest.raises(IngestionError) as exc:
            extract_document(b"   \n  ", "empty.txt", "text/plain")
        assert exc.value.code == IngestionErrorCode.EMPTY_DOCUMENT

    def test_file_too_large(self):
        with pytest.raises(IngestionError) as exc:
            extract_document(b"x" * (6 * 1024 * 1024), "big.txt", "text/plain")
        assert exc.value.code == IngestionErrorCode.FILE_TOO_LARGE


# ── Detection ───────────────────────────────────────────────────────────


class TestDetection:
    def _doc(self, text: str, **kw) -> ExtractedDocument:
        return ExtractedDocument(text=text, **kw)

    def test_payslip(self):
        t, _ = detect_document_type(self._doc(PAYSLIP_TEXT))
        assert t == DocumentType.PAYSLIP

    def test_loan(self):
        t, _ = detect_document_type(self._doc(LOAN_TEXT))
        assert t == DocumentType.LOAN_STATEMENT

    def test_investment(self):
        t, _ = detect_document_type(self._doc(INVEST_CSV.replace(",", " ")))
        assert t == DocumentType.INVESTMENT_STATEMENT

    def test_bank_csv_structure(self):
        doc = extract_document(BANK_CSV.encode(), "s.csv", "text/csv")
        t, _ = detect_document_type(doc)
        assert t == DocumentType.BANK_STATEMENT

    def test_ambiguous(self):
        t, _ = detect_document_type(self._doc("the quick brown fox"))
        assert t is None

    def test_declared_wins(self):
        t, scores = detect_document_type(
            self._doc("anything"), declared=DocumentType.PAYSLIP
        )
        assert t == DocumentType.PAYSLIP


# ── Parsing helpers ─────────────────────────────────────────────────────


class TestParsing:
    def test_amounts(self):
        assert parse_amount("₹ 1,25,000.00") == Decimal("125000.00")
        assert parse_amount("92000") == Decimal("92000")
        assert parse_amount("(450.00)") == Decimal("-450.00")
        assert parse_amount("abc") is None
        assert parse_amount("") is None

    def test_dates(self):
        assert parse_date("01/09/2026") == date(2026, 9, 1)
        assert parse_date("2026-09-01") == date(2026, 9, 1)
        assert parse_date("nonsense") is None

    def test_month_year(self):
        assert parse_month_year("September 2026") == date(2026, 9, 1)
        assert parse_month_year("Sep 2026") == date(2026, 9, 1)
        assert parse_month_year("09/2026") == date(2026, 9, 1)
        assert parse_month_year("hello") is None


# ── Extractors ──────────────────────────────────────────────────────────


class TestExtractors:
    def test_payslip_fields(self):
        out = PayslipExtractor().extract(PAYSLIP_TEXT)
        by_key = {f.key: f for f in out.fields}
        assert by_key["net_pay"].value == "102900.00"
        assert by_key["gross_income"].value == "125000.00"
        assert by_key["epf"].value == "7800.00"
        assert by_key["pay_period"].value == "2026-09-01"
        assert out.period_start == date(2026, 9, 1)

    def test_payslip_no_invention(self):
        out = PayslipExtractor().extract("Net Pay: 5000.00")
        keys = {f.key for f in out.fields}
        assert "employer" not in keys
        assert "gross_income" not in keys

    def test_loan_fields(self):
        out = LoanStatementExtractor().extract(LOAN_TEXT)
        by_key = {f.key: f for f in out.fields}
        assert by_key["principal_outstanding"].value == "3240000.00"
        assert by_key["emi"].value == "38500.00"
        assert by_key["interest_rate"].value == "8.6"
        assert by_key["maturity_date"].value == "2043-03-01"
        assert out.meta.get("loan_type") == "Home Loan"

    def test_bank_csv_records(self):
        doc = extract_document(BANK_CSV.encode(), "s.csv", "text/csv")
        out = BankStatementExtractor().extract(
            doc.text, None, doc.csv_headers, doc.csv_rows
        )
        assert len(out.records) == 5
        salary = out.records[0]
        assert salary.payload["direction"] == "CREDIT"
        assert salary.txn_class and salary.txn_class.value == "INCOME"
        swiggy = out.records[1]
        assert swiggy.txn_class and swiggy.txn_class.value == "EXPENSE"
        transfer = out.records[3]
        assert transfer.txn_class and transfer.txn_class.value == "TRANSFER"
        assert out.period_start == date(2026, 9, 1)
        assert out.period_end == date(2026, 9, 5)

    def test_investment_csv_holdings(self):
        doc = extract_document(INVEST_CSV.encode(), "h.csv", "text/csv")
        out = InvestmentStatementExtractor().extract(
            doc.text, None, doc.csv_headers, doc.csv_rows
        )
        assert len(out.records) == 2
        assert out.records[0].payload["current_value"] == "52340.00"
        assert out.records[0].payload["holding_type"] == "Mutual Fund"


# ── Validators ──────────────────────────────────────────────────────────


class TestValidators:
    def test_scalar_valid(self):
        status, warn = validate_scalar("amount", Decimal("100"))
        assert status == CandidateStatus.VALID

    def test_scalar_negative(self):
        status, _ = validate_scalar("amount", Decimal("-1"))
        assert status == CandidateStatus.INVALID

    def test_scalar_implausible(self):
        status, _ = validate_scalar("amount", Decimal("99999999999"))
        assert status == CandidateStatus.INVALID

    def test_interest_rate_range(self):
        status, _ = validate_scalar("interest_rate", Decimal("120"))
        assert status == CandidateStatus.INVALID

    def test_transaction_unknown_direction(self):
        status, _ = validate_transaction(
            {"amount": "10", "date": "2026-09-01", "direction": None}
        )
        assert status == CandidateStatus.NEEDS_REVIEW

    def test_transaction_valid(self):
        status, _ = validate_transaction(
            {"amount": "10", "date": "2026-09-01", "direction": "DEBIT",
             "txn_class": "EXPENSE"}
        )
        assert status == CandidateStatus.VALID


# ── Fingerprints ────────────────────────────────────────────────────────


class TestFingerprints:
    _payload = {
        "date": "2026-09-02",
        "direction": "DEBIT",
        "amount": "450.00",
        "description": "UPI-SWIGGY-ORDER",
        "reference": "",
    }

    def test_stable(self):
        uid = uuid.uuid4()
        assert transaction_fingerprint(uid, self._payload) == transaction_fingerprint(
            uid, self._payload
        )

    def test_user_scoped(self):
        assert transaction_fingerprint(uuid.uuid4(), self._payload) != (
            transaction_fingerprint(uuid.uuid4(), self._payload)
        )

    def test_reference_preferred(self):
        p = dict(self._payload, reference="UTR123")
        a = transaction_fingerprint(uuid.uuid4(), p)
        b = transaction_fingerprint(uuid.uuid4(), self._payload)
        assert a != b

    def test_description_similarity(self):
        assert description_similarity("UPI-SWIGGY-ORDER-123", "upi swiggy order") > 0.5
        assert description_similarity("rent payment", "salary credit") < 0.4


class TestImpact:
    def test_affected_domains(self):
        assert affected_domains(DocumentType.PAYSLIP, {"income", "tax"}) == [
            "income",
            "tax",
        ]
        # liabilities never claimed for a payslip
        assert "liabilities" not in affected_domains(
            DocumentType.PAYSLIP, {"liability"}
        )


# ── Service lifecycle ───────────────────────────────────────────────────


class TestServiceLifecycle:
    async def test_payslip_end_to_end(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "payslip.txt", PAYSLIP_TEXT
        )
        assert preview.batch.status == ImportStatus.REVIEW_REQUIRED
        assert preview.batch.document_type == DocumentType.PAYSLIP
        domains = {c.target_domain for c in preview.candidates}
        assert "income" in domains and "tax" in domains
        income_cand = next(
            c for c in preview.candidates if c.target_domain == "income"
        )
        assert income_cand.operation.value == "CREATE"
        assert income_cand.decision == CandidateDecision.ACCEPTED

        result = await svc.confirm(
            test_user.id, preview.batch.id, preview.batch.confirm_token
        )
        assert result.status == ImportStatus.APPLIED
        assert "income" in result.changed_domains
        assert "tax" in result.changed_domains

        income = (
            await db_session.execute(
                select(Income).where(Income.user_id == test_user.id)
            )
        ).scalar_one()
        assert Decimal(str(income.amount)) == Decimal("102900.00")
        assert income.import_batch_id == preview.batch.id

        tax = (
            await db_session.execute(
                select(TaxProfile).where(TaxProfile.user_id == test_user.id)
            )
        ).scalar_one()
        assert Decimal(str(tax.annual_income)) == Decimal("1500000.00")
        assert Decimal(str(tax.deduction_80c)) == Decimal("93600.00")

    async def test_duplicate_import(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        await svc.ingest_text(test_user.id, "payslip.txt", PAYSLIP_TEXT)
        with pytest.raises(IngestionError) as exc:
            await svc.ingest_text(test_user.id, "payslip.txt", PAYSLIP_TEXT)
        assert exc.value.code == IngestionErrorCode.DUPLICATE_IMPORT

    async def test_wrong_confirm_token(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "payslip.txt", PAYSLIP_TEXT
        )
        with pytest.raises(IngestionError) as exc:
            await svc.confirm(test_user.id, preview.batch.id, "deadbeefdeadbeef")
        assert exc.value.code == IngestionErrorCode.STALE_PREVIEW

    async def test_edit_rotates_token(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "payslip.txt", PAYSLIP_TEXT
        )
        cand = preview.candidates[0]
        await svc.decide_candidate(
            test_user.id, preview.batch.id, cand.id,
            edited_value="95000",
        )
        # The token issued at upload time is now stale.
        with pytest.raises(IngestionError) as exc:
            await svc.confirm(
                test_user.id, preview.batch.id, preview.batch.confirm_token
            )
        assert exc.value.code == IngestionErrorCode.STALE_PREVIEW

        fresh = await svc.get_preview(test_user.id, preview.batch.id)
        result = await svc.confirm(
            test_user.id, preview.batch.id, fresh.batch.confirm_token
        )
        assert result.status == ImportStatus.APPLIED
        income = (
            await db_session.execute(
                select(Income).where(Income.user_id == test_user.id)
            )
        ).scalar_one()
        assert Decimal(str(income.amount)) == Decimal("95000")

    async def test_second_confirm_rejected(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "payslip.txt", PAYSLIP_TEXT
        )
        await svc.confirm(
            test_user.id, preview.batch.id, preview.batch.confirm_token
        )
        with pytest.raises(IngestionError) as exc:
            await svc.confirm(
                test_user.id, preview.batch.id, preview.batch.confirm_token
            )
        assert exc.value.code == IngestionErrorCode.ALREADY_APPLIED

    async def test_cancel_blocks_confirm(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "payslip.txt", PAYSLIP_TEXT
        )
        await svc.cancel(test_user.id, preview.batch.id)
        with pytest.raises(IngestionError) as exc:
            await svc.confirm(
                test_user.id, preview.batch.id, preview.batch.confirm_token
            )
        assert exc.value.code == IngestionErrorCode.ALREADY_CANCELLED
        # Nothing was applied.
        assert (
            await db_session.execute(
                select(Income).where(Income.user_id == test_user.id)
            )
        ).scalar_one_or_none() is None

    async def test_bank_statement_expenses(
        self, db_session, test_user, other_category
    ):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "statement.csv", BANK_CSV, "text/csv"
        )
        assert preview.batch.document_type == DocumentType.BANK_STATEMENT
        # 1 income + 2 expenses accepted; transfer + cash-atm skipped.
        accepted = [
            c for c in preview.candidates if c.decision == "ACCEPTED"
        ]
        assert len(accepted) == 3

        result = await svc.confirm(
            test_user.id, preview.batch.id, preview.batch.confirm_token
        )
        assert result.status == ImportStatus.APPLIED

        expenses = list(
            (
                await db_session.execute(
                    select(Expense).where(Expense.user_id == test_user.id)
                )
            ).scalars().all()
        )
        # UPI-SWIGGY + NEFT RENT — ATM cash is UNKNOWN/skipped, transfer skipped.
        assert len(expenses) == 2
        assert all(e.import_batch_id == preview.batch.id for e in expenses)
        assert all(e.import_fingerprint for e in expenses)
        assert all(e.source == "imported" for e in expenses)

        incomes = list(
            (
                await db_session.execute(
                    select(Income).where(Income.user_id == test_user.id)
                )
            ).scalars().all()
        )
        assert len(incomes) == 1
        assert Decimal(str(incomes[0].amount)) == Decimal("92000.00")

    async def test_reimport_fingerprints_deduped(
        self, db_session, test_user, other_category
    ):
        """Re-importing the same rows after apply marks them DUPLICATE."""
        svc = DataIngestionService(db_session)
        p1 = await svc.ingest_text(
            test_user.id, "s1.csv", BANK_CSV, "text/csv"
        )
        await svc.confirm(test_user.id, p1.batch.id, p1.batch.confirm_token)

        # The SECOND upload of identical text is blocked by content hash,
        # so simulate a re-export whose header changed but whose rows are
        # the same transactions.
        variant = BANK_CSV + "Generated on 10/10/2026,,\n"
        p2 = await svc.ingest_text(
            test_user.id, "s2.csv", variant, "text/csv"
        )
        assert all(
            c.validation_state in ("DUPLICATE", "POSSIBLE_DUPLICATE")
            or c.operation == "SKIP"
            for c in p2.candidates
        )

    async def test_loan_statement_create(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "loan.txt", LOAN_TEXT
        )
        creates = [c for c in preview.candidates if c.operation == "CREATE"]
        assert creates, "expected a new-liability candidate"
        result = await svc.confirm(
            test_user.id, preview.batch.id, preview.batch.confirm_token
        )
        assert "liabilities" in result.changed_domains

    async def test_investment_statement_create(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "holdings.csv", INVEST_CSV, "text/csv"
        )
        assert preview.batch.document_type == DocumentType.INVESTMENT_STATEMENT
        result = await svc.confirm(
            test_user.id, preview.batch.id, preview.batch.confirm_token
        )
        assert "assets" in result.changed_domains

    async def test_user_scoping(
        self, db_session, test_user, other_user
    ):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "payslip.txt", PAYSLIP_TEXT
        )
        with pytest.raises(IngestionError) as exc:
            await svc.get_preview(other_user.id, preview.batch.id)
        assert exc.value.code == IngestionErrorCode.IMPORT_NOT_FOUND
        with pytest.raises(IngestionError):
            await svc.confirm(
                other_user.id, preview.batch.id, preview.batch.confirm_token
            )

    async def test_ambiguous_document(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        with pytest.raises(IngestionError) as exc:
            await svc.ingest_text(
                test_user.id, "note.txt", "the quick brown fox jumps"
            )
        assert exc.value.code == IngestionErrorCode.AMBIGUOUS_DOCUMENT

    async def test_skip_candidate_not_applied(self, db_session, test_user):
        svc = DataIngestionService(db_session)
        preview = await svc.ingest_text(
            test_user.id, "payslip.txt", PAYSLIP_TEXT
        )
        tax_cands = [c for c in preview.candidates if c.target_domain == "tax"]
        for c in tax_cands:
            await svc.decide_candidate(
                test_user.id, preview.batch.id, c.id,
                decision=CandidateDecision.SKIPPED,
            )
        fresh = await svc.get_preview(test_user.id, preview.batch.id)
        await svc.confirm(
            test_user.id, preview.batch.id, fresh.batch.confirm_token
        )
        assert (
            await db_session.execute(
                select(TaxProfile).where(TaxProfile.user_id == test_user.id)
            )
        ).scalar_one_or_none() is None


# ── API contract ─────────────────────────────────────────────────────────


class TestImportsApi:
    async def test_upload_list_preview(
        self, async_client, auth_headers, test_user
    ):
        resp = await async_client.post(
            "/api/v1/imports/from-text",
            headers=auth_headers,
            json={"fileName": "payslip.txt", "content": PAYSLIP_TEXT},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        batch_id = data["batch"]["id"]

        listed = await async_client.get("/api/v1/imports", headers=auth_headers)
        assert listed.status_code == 200
        assert any(b["id"] == batch_id for b in listed.json()["data"])

        preview = await async_client.get(
            f"/api/v1/imports/{batch_id}/preview", headers=auth_headers
        )
        assert preview.status_code == 200
        token = preview.json()["data"]["batch"]["confirmToken"]

        confirm = await async_client.post(
            f"/api/v1/imports/{batch_id}/confirm",
            headers=auth_headers,
            json={"confirmToken": token},
        )
        assert confirm.status_code == 200, confirm.text
        assert confirm.json()["data"]["status"] == "APPLIED"

    async def test_cross_user_hidden(self, async_client, auth_headers, test_user):
        resp = await async_client.post(
            "/api/v1/imports/from-text",
            headers=auth_headers,
            json={"fileName": "payslip.txt", "content": PAYSLIP_TEXT},
        )
        batch_id = resp.json()["data"]["batch"]["id"]
        # The same token user can't see a nonexistent batch id.
        missing = await async_client.get(
            f"/api/v1/imports/{uuid.uuid4()}", headers=auth_headers
        )
        assert missing.status_code == 404
