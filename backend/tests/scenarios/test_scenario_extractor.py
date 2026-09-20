"""Extractor tests — conservative NL → typed scenario proposals."""

from __future__ import annotations

import pytest

from app.scenarios.extractor import extract_scenario
from app.scenarios.scenario_types import ScenarioType


@pytest.mark.parametrize(
    "text,stype,key,value",
    [
        ("what if my salary increases by 10%?", "INCOME_CHANGE", "changeValue", 10.0),
        ("what if my income goes to 90000?", "INCOME_CHANGE", "changeValue", 90000.0),
        ("what if my expenses go up by 20%?", "EXPENSE_CHANGE", "changeValue", 20.0),
        ("what if I retire at 50?", "RETIREMENT_AGE_CHANGE", "newRetirementAge", 50),
        ("what if inflation is 8%?", "INFLATION_CHANGE", "newInflationRate", 0.08),
        ("what if I save 5000 more a month?", "MONTHLY_SAVINGS_CHANGE", "changeAmount", 5000.0),
        ("what if my EMI goes to 15000?", "LOAN_EMI_CHANGE", "newEmi", 15000.0),
    ],
)
def test_extracts_scenario(text, stype, key, value):
    proposal = extract_scenario(text)
    assert proposal is not None
    assert proposal.scenario_type == stype
    assert proposal.parameters[key] == value


def test_income_set_vs_amount():
    p = extract_scenario("what if my salary increases to 90000?")
    assert p.parameters["changeType"] == "set"
    p2 = extract_scenario("what if my income drops by 10000?")
    assert p2.parameters["changeType"] == "amount"
    assert p2.parameters["changeValue"] == -10000.0


def test_purchase_extraction():
    p = extract_scenario("can I afford a ₹75,000 laptop?")
    assert p.scenario_type == "PURCHASE"
    assert p.parameters["purchaseAmount"] == 75000.0
    assert p.parameters["itemName"] == "Laptop"


def test_purchase_lakh_and_months():
    p = extract_scenario("can I afford a 2 lakh bike in 6 months?")
    assert p.parameters["purchaseAmount"] == 200000.0
    assert p.parameters["monthsFromNow"] == 6


def test_loan_prepayment():
    p = extract_scenario("what if I prepay ₹50,000 on my home loan?")
    assert p.scenario_type == "LOAN_PREPAYMENT"
    assert p.parameters["prepaymentAmount"] == 50000.0
    assert p.parameters["loanName"] == "Home"


def test_category_spend():
    p = extract_scenario("what if I spend 3000 less on dining?")
    assert p.scenario_type == "CATEGORY_SPENDING_CHANGE"
    assert p.parameters["categoryName"] == "Dining"
    assert p.parameters["changeValue"] == -3000.0


def test_emergency_fund():
    p = extract_scenario("what if my emergency fund target is 9 months?")
    assert p.scenario_type == "EMERGENCY_FUND_TARGET_CHANGE"
    assert p.parameters["targetMonths"] == 9


def test_missing_values_surface_as_fields():
    p = extract_scenario("what if I retire earlier?")
    assert p.scenario_type == "RETIREMENT_AGE_CHANGE"
    assert "new_retirement_age" in p.missing_fields


@pytest.mark.parametrize(
    "text",
    [
        "add expense 500 for food",
        "set my food budget to 6000",
        "what is my net worth?",
        "show my spending report",
        "log income of 80000",
        "",
    ],
)
def test_non_scenario_messages_rejected(text):
    assert extract_scenario(text) is None
