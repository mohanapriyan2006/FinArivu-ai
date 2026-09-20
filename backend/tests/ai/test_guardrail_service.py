"""Tests for GuardrailService PII masking and policy enforcement."""
from __future__ import annotations

from app.ai.guardrails.guardrail_service import GuardrailService


class TestPIIMasking:
    def test_pan_masked(self):
        gs = GuardrailService()
        masked = gs.mask_pii("My PAN is ABCDE1234F")
        assert "***PAN***" in masked
        assert "ABCDE1234F" not in masked

    def test_aadhaar_masked(self):
        gs = GuardrailService()
        masked = gs.mask_pii("Aadhaar 1234 5678 9012")
        assert "XXXX-XXXX-XXXX" in masked
        assert "1234 5678 9012" not in masked

    def test_credit_card_masked(self):
        gs = GuardrailService()
        masked = gs.mask_pii("Card 4111 1111 1111 1111")
        assert "XXXX-XXXX-XXXX-XXXX" in masked

    def test_phone_masked(self):
        gs = GuardrailService()
        masked = gs.mask_pii("Call me at 9876543210")
        assert "***PHONE***" in masked

    def test_email_masked(self):
        gs = GuardrailService()
        masked = gs.mask_pii("Email: test@example.com")
        assert "***EMAIL***" in masked

    def test_multiple_pii_masked(self):
        gs = GuardrailService()
        masked = gs.mask_pii("PAN ABCDE1234F, email test@example.com, phone 9876543210")
        assert "***PAN***" in masked
        assert "***EMAIL***" in masked
        assert "***PHONE***" in masked

    def test_no_pii_unchanged(self):
        gs = GuardrailService()
        text = "How is my budget this month?"
        assert gs.mask_pii(text) == text


class TestGuardrailServiceCheck:
    def test_safe_message_allowed(self):
        gs = GuardrailService()
        result = gs.check("How much should I save for retirement?")
        assert result["allowed"] is True
        assert result["response"] is None

    def test_sql_injection_blocked(self):
        gs = GuardrailService()
        result = gs.check("SELECT * FROM users; DROP TABLE--")
        assert result["allowed"] is False
        assert result["reason"] == "sql_injection"

    def test_sql_injection_blocked_union_select(self):
        gs = GuardrailService()
        result = gs.check("' OR '1'='1' UNION SELECT password FROM users")
        assert result["allowed"] is False
        assert result["reason"] == "sql_injection"

    def test_action_verbs_not_sql_injection(self):
        """Financial CRUD phrasing must not be blocked as SQL."""
        gs = GuardrailService()
        for message in [
            "Update my food expenses to 3500 rs",
            "Set my dining budget to 8000",
            "Change my grocery budget to Rs 7,500",
            "Delete the duplicate expense",
        ]:
            result = gs.check(message)
            assert result["allowed"] is True, message

    def test_amount_patterns_are_financial(self):
        """Messages with amounts or money verbs are in scope."""
        gs = GuardrailService()
        for message in [
            "Add Rs 2000",
            "spent 500 on groceries",
            "add 1.5 lakh to savings",
            "paid 350 for chai",
        ]:
            result = gs.check(message)
            assert result["allowed"] is True, message

    def test_pure_non_financial_still_blocked(self):
        gs = GuardrailService()
        result = gs.check("What is the weather in Mumbai tomorrow?")
        assert result["allowed"] is False
        assert result["reason"] == "non_financial"
