"""Deterministic NL action extractor tests."""

from __future__ import annotations

from datetime import date

from app.actions.extractor import extract_action


def test_update_budget() -> None:
    p = extract_action("Set my dining budget to Rs 8,000.")
    assert p is not None
    assert p.operation == "UPDATE_BUDGET"
    assert p.arguments["categoryName"] == "dining"
    assert p.arguments["monthlyLimit"] == 8000.0


def test_create_expense() -> None:
    p = extract_action("Add Rs 1,250 for food today.")
    assert p is not None
    assert p.operation == "CREATE_EXPENSE"
    assert p.arguments["amount"] == 1250.0
    assert p.arguments["categoryName"] == "food"
    assert p.arguments["expenseDate"] == date.today().isoformat()


def test_create_goal_with_month() -> None:
    p = extract_action("Create a goal to save Rs 75,000 for a laptop by December.")
    assert p is not None
    assert p.operation == "CREATE_GOAL"
    assert p.arguments["goalName"] == "laptop"
    assert p.arguments["targetAmount"] == 75000.0
    assert p.arguments["targetDate"].endswith("-12-31")


def test_update_income_lakh() -> None:
    p = extract_action("Update my salary income to Rs 1 lakh.")
    assert p is not None
    assert p.operation == "UPDATE_INCOME"
    assert p.arguments["source"] == "salary"
    assert p.arguments["amount"] == 100000.0


def test_create_income() -> None:
    p = extract_action("I received Rs 10,000 salary today.")
    assert p is not None
    assert p.operation == "CREATE_INCOME"
    assert p.arguments["amount"] == 10000.0
    assert p.arguments["source"] == "Salary"


def test_update_goal() -> None:
    p = extract_action("Increase my laptop goal to Rs 90,000.")
    assert p is not None
    assert p.operation == "UPDATE_GOAL"
    assert p.arguments["goalName"] == "laptop"
    assert p.arguments["targetAmount"] == 90000.0


def test_recurring_expense() -> None:
    p = extract_action("Add a Rs 2,000 recurring transport expense.")
    assert p is not None
    assert p.operation == "CREATE_EXPENSE"
    assert p.arguments["isRecurring"] is True
    assert p.arguments["categoryName"] == "transport"


def test_bare_amount_needs_category() -> None:
    p = extract_action("Add Rs 2000.")
    assert p is not None
    assert p.operation == "CREATE_EXPENSE"
    assert "categoryName" in p.missing_fields


def test_bare_budget_needs_category() -> None:
    p = extract_action("Change my budget to Rs 5000.")
    assert p is not None
    assert p.operation == "UPDATE_BUDGET"
    assert "categoryName" in p.missing_fields


def test_bare_goal_needs_fields() -> None:
    p = extract_action("Update my goal.")
    assert p is not None
    assert p.operation == "UPDATE_GOAL"
    assert set(p.missing_fields) == {"targetAmount", "goalName"}


def test_bare_expense_needs_fields() -> None:
    p = extract_action("Add an expense.")
    assert p is not None
    assert p.operation == "CREATE_EXPENSE"
    assert set(p.missing_fields) == {"amount", "categoryName"}


def test_questions_are_not_actions() -> None:
    for text in (
        "How much did I spend on food?",
        "What is my health score?",
        "Why is my budget overspent?",
        "Show me my goals.",
    ):
        assert extract_action(text) is None


def test_create_expense_category_first_equals() -> None:
    p = extract_action("Create a new expense as fuel = 2000 rs for this month")
    assert p is not None
    assert p.operation == "CREATE_EXPENSE"
    assert p.arguments["categoryName"] == "fuel"
    assert p.arguments["amount"] == 2000.0


def test_update_expense_plural() -> None:
    p = extract_action("Update my food expenses to 3600 rs")
    assert p is not None
    assert p.operation == "UPDATE_EXPENSE"
    assert p.arguments["categoryName"] == "food"
    assert p.arguments["amount"] == 3600.0


def test_bare_create_goal_needs_fields() -> None:
    p = extract_action("Create a goal")
    assert p is not None
    assert p.operation == "CREATE_GOAL"
    assert set(p.missing_fields) == {"goalName", "targetAmount"}


def test_bare_create_budget_needs_fields() -> None:
    p = extract_action("Create budget")
    assert p is not None
    assert p.operation == "CREATE_BUDGET"
    assert set(p.missing_fields) == {"categoryName", "monthlyLimit"}


def test_create_budget_category_only() -> None:
    p = extract_action("Create a food budget")
    assert p is not None
    assert p.operation == "CREATE_BUDGET"
    assert p.arguments["categoryName"] == "food"
    assert "monthlyLimit" in p.missing_fields


def test_bare_add_income_needs_fields() -> None:
    p = extract_action("Add income")
    assert p is not None
    assert p.operation == "CREATE_INCOME"
    assert "amount" in p.missing_fields


def test_aspirational_not_an_action() -> None:
    assert extract_action("I want to buy a new electric car") is None
    assert (
        extract_action("Help me plan a savings target to buy a house") is None
    )
