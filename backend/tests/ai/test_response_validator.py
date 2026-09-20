"""Deterministic response validator — grounding without over-blocking."""

from app.ai.schemas import AgentResult
from app.ai.schemas.orchestration import FinancialContext
from app.ai.validator.response_validation_service import ResponseValidationService


def _ctx() -> FinancialContext:
    return FinancialContext(user_id="u1", session_id="s1")


def _agent(name: str, data: dict | None = None) -> AgentResult:
    return AgentResult(
        agent_name=name, intent="general", data=data or {}, confidence=0.9,
    )


def test_educational_numbers_pass_without_engine_data() -> None:
    """Rules of thumb (50/30/20, step numbers) are not user-data claims."""
    svc = ResponseValidationService(local=_UnavailableLocal())
    result = svc._deterministic_check(
        "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings. "
        "Step 1: track every expense for 3 months.",
        _ctx(),
        [_agent("EducationAgent", {"explanation": "..."})],
    )
    assert result.status == "PASS"


def test_invented_currency_flagged_when_engine_data_present() -> None:
    svc = ResponseValidationService(local=_UnavailableLocal())
    result = svc._deterministic_check(
        "Your food spending is ₹99,999 this month.",
        _ctx(),
        [_agent("BudgetAgent", {"totalSpent": 5800.0, "totalBudget": 12000.0})],
    )
    assert result.status == "REJECT"
    assert result.numerical_errors


def test_grounded_currency_passes_with_tolerance() -> None:
    svc = ResponseValidationService(local=_UnavailableLocal())
    result = svc._deterministic_check(
        "You've spent ₹5,800 of your ₹12,000 budget.",
        _ctx(),
        [_agent("BudgetAgent", {"totalSpent": 5800.0, "totalBudget": 12000.0})],
    )
    assert result.status == "PASS"


def test_datamissing_engine_counts_as_no_data() -> None:
    svc = ResponseValidationService(local=_UnavailableLocal())
    result = svc._deterministic_check(
        "Aim to keep rent under 30% of income and save 20%.",
        _ctx(),
        [_agent("GoalAgent", {"dataMissing": True})],
    )
    assert result.status == "PASS"


class _UnavailableLocal:
    class _Cfg:
        @staticmethod
        def is_available() -> bool:
            return False

    _config = _Cfg()
