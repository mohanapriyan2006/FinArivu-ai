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
