"""Deterministic NL extraction for Scenario Lab requests.

Conservative rule-based parsing: only fires on explicit simulation phrasing
("what if", "what happens if", "if I …", "can I afford", "simulate") with a
concrete value or clear entity. Never invents missing numbers — it returns
``missing_fields`` so the service can ask a targeted clarification.
"""

from __future__ import annotations

import re
from decimal import Decimal

from app.scenarios.scenario_types import ScenarioType
from app.scenarios.schemas import ScenarioProposal

_NUM = (
    r"(?:rs\.?|inr|₹)?\s*([0-9][0-9,]*(?:\.\d+)?)"
    r"\s*(lakh|lac|crore|cr|thousand|l|k)?\b"
)
_PCT = r"([0-9]+(?:\.\d+)?)\s*(?:%|percent|per\s*cent)"


def _amount_from(match: re.Match, group: int, unit_group: int) -> Decimal | None:
    raw = match.group(group)
    if raw is None:
        return None
    value = Decimal(raw.replace(",", ""))
    unit = (match.group(unit_group) or "").lower()
    if unit in ("lakh", "lac", "l"):
        value *= Decimal("100000")
    elif unit in ("crore", "cr"):
        value *= Decimal("10000000")
    elif unit in ("k", "thousand"):
        value *= Decimal("1000")
    return value


_SCENARIO_INTENT = re.compile(
    r"\b(what\s+if|what\s+would\s+happen|what\s+happens\s+if|simulate|"
    r"scenario|can\s+i\s+afford|should\s+i\s+buy|worth\s+buying|"
    r"how\s+(?:would|does|will).*(?:change|affect|impact))\b",
    re.IGNORECASE,
)


def extract_scenario(text: str) -> ScenarioProposal | None:
    """Return a scenario proposal for explicit simulation phrasing."""
    if not text or not _SCENARIO_INTENT.search(text):
        return None
    lower = text.lower()

    # Can I afford / should I buy → PURCHASE
    if re.search(r"\b(can\s+i\s+afford|should\s+i\s+buy|worth\s+buying)\b", lower):
        return _purchase(text)

    for probe in (_income_change, _expense_change, _retirement_age,
                  _inflation, _loan_prepayment, _loan_emi, _emergency_fund,
                  _savings_change, _category_spend, _goal_deadline):
        proposal = probe(text)
        if proposal is not None:
            return proposal
    return None


def _income_change(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    if not re.search(r"\b(income|salary|pay\s*raise|raise|earn(?:ing)?s?)\b", lower):
        return None
    pct = re.search(_PCT, lower)
    if pct and re.search(
        r"\b(increas\w*|up|higher|grow\w*|rais\w*|ris\w*|jump\w*)\b", lower
    ):
        return ScenarioProposal(
            scenario_type=ScenarioType.INCOME_CHANGE.value,
            parameters={"changeType": "percent",
                        "changeValue": float(pct.group(1))},
            reason="User asked to simulate an income change",
            confidence=0.8,
        )
    amt = re.search(_NUM, text)
    if amt:
        value = _amount_from(amt, 1, 2)
        if value:
            before = lower[: amt.start()].strip()
            if re.search(r"(?:to|become\w*|is|at)\s*$", before):
                return ScenarioProposal(
                    scenario_type=ScenarioType.INCOME_CHANGE.value,
                    parameters={"changeType": "set", "changeValue": float(value)},
                    reason="User asked to simulate an income change",
                    confidence=0.75,
                )
            negative = bool(re.search(r"\b(los[et]|drop\w*|cut|lower|decreas\w*|reduc\w*)\b", lower))
            return ScenarioProposal(
                scenario_type=ScenarioType.INCOME_CHANGE.value,
                parameters={
                    "changeType": "amount",
                    "changeValue": float(-value if negative else value),
                },
                reason="User asked to simulate an income change",
                confidence=0.75,
            )
    return ScenarioProposal(
        scenario_type=ScenarioType.INCOME_CHANGE.value,
        parameters={},
        missing_fields=["change_value"],
        reason="Income scenario without a concrete change",
        confidence=0.6,
    )


def _expense_change(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    # Guard: category-scoped and budget phrasing handled by other probes.
    if re.search(r"\b(budget|on\s+[a-z]+)\b", lower) and re.search(
        r"\b(spend|spending)\s+on\b", lower
    ):
        return None
    if not re.search(r"\b(expense|expenses|spending|spend|costs?)\b", lower):
        return None
    pct = re.search(_PCT, lower)
    direction_up = bool(
        re.search(r"\b(increas\w*|up|higher|ris\w*|more)\b", lower)
    )
    direction_down = bool(
        re.search(r"\b(cut|reduc\w*|lower|less|down|save)\b", lower)
    )
    if pct and (direction_up or direction_down):
        value = float(pct.group(1))
        return ScenarioProposal(
            scenario_type=ScenarioType.EXPENSE_CHANGE.value,
            parameters={
                "changeType": "percent",
                "changeValue": value if direction_up else -value,
            },
            reason="User asked to simulate an expense change",
            confidence=0.75,
        )
    return None


def _category_spend(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    # "spend on dining ₹3,000 less" / "spending on food is ₹3,000"
    m = re.search(
        r"\b(?:spend|spending)\s+(?:on\s+)?([a-zA-Z ]+?)\s*(?:is|by)?\s*"
        + _NUM + r"\s*(?:more|less|a\s*month|per\s*month|monthly)?",
        text,
        re.IGNORECASE,
    )
    category = None
    value = None
    negative = bool(re.search(r"\b(less|cut|reduc\w*|lower)\b", lower))
    if m:
        category = m.group(1).strip()
        value = _amount_from(m, 2, 3)
        if category.lower() in ("i", "more", "less", "on"):
            category = None
    if category is None or value is None:
        # "spend ₹3,000 less on dining" — amount-first order.
        m2 = re.search(
            r"\bspend\s+" + _NUM + r"\s*(?:more|less)?\s+on\s+"
            r"([a-zA-Z ]+?)\s*(?:a\s*month|per\s*month|every\s*month|monthly|[?.,!]|$)",
            text,
            re.IGNORECASE,
        )
        if not m2:
            return None
        category = m2.group(3).strip()
        value = _amount_from(m2, 1, 2)
    if not category or value is None:
        return None
    return ScenarioProposal(
        scenario_type=ScenarioType.CATEGORY_SPENDING_CHANGE.value,
        parameters={
            "categoryName": category.title(),
            "changeType": "amount",
            "changeValue": float(-value if negative else value),
        },
        reason="User asked to simulate a category spending change",
        confidence=0.7,
    )


def _savings_change(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    if not re.search(r"\bsav(?:e|ing|ings)\b", lower):
        return None
    m = re.search(_NUM + r"\s*(?:more|less)?\s*(?:a|per|every|each)?\s*month", text, re.IGNORECASE)
    if not m:
        return None
    value = _amount_from(m, 1, 2)
    if value is None:
        return None
    negative = bool(re.search(r"\bless\b", lower))
    return ScenarioProposal(
        scenario_type=ScenarioType.MONTHLY_SAVINGS_CHANGE.value,
        parameters={"changeAmount": float(-value if negative else value)},
        reason="User asked to simulate a monthly savings change",
        confidence=0.75,
    )


def _retirement_age(text: str) -> ScenarioProposal | None:
    m = re.search(
        r"\bretir\w*\s+(?:at|by|when|earlier|later)?\s*(?:age\s+)?(\d{2})\b",
        text,
        re.IGNORECASE,
    )
    if not m:
        if re.search(r"\bretir\w*\s+(early|earlier)\b", text, re.IGNORECASE):
            return ScenarioProposal(
                scenario_type=ScenarioType.RETIREMENT_AGE_CHANGE.value,
                parameters={},
                missing_fields=["new_retirement_age"],
                reason="Early-retirement scenario without an age",
                confidence=0.6,
            )
        return None
    return ScenarioProposal(
        scenario_type=ScenarioType.RETIREMENT_AGE_CHANGE.value,
        parameters={"newRetirementAge": int(m.group(1))},
        reason="User asked to simulate a retirement age",
        confidence=0.8,
    )


def _inflation(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    if "inflation" not in lower:
        return None
    pct = re.search(_PCT, lower)
    if pct:
        return ScenarioProposal(
            scenario_type=ScenarioType.INFLATION_CHANGE.value,
            parameters={"newInflationRate": float(pct.group(1)) / 100},
            reason="User asked to simulate inflation",
            confidence=0.8,
        )
    return ScenarioProposal(
        scenario_type=ScenarioType.INFLATION_CHANGE.value,
        parameters={},
        missing_fields=["new_inflation_rate"],
        reason="Inflation scenario without a rate",
        confidence=0.6,
    )


def _loan_prepayment(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    if not re.search(r"\b(pre\s*pay|prepay\w*|foreclos\w*|part\s*pay\w*)\b", lower):
        return None
    amt = re.search(_NUM, text)
    value = _amount_from(amt, 1, 2) if amt else None
    loan = re.search(
        r"\b(?:on|towards?|of)\s+(?:my\s+|the\s+)?([a-zA-Z ]+?)\s+loan\b",
        lower,
    )
    params: dict = {}
    if value:
        params["prepaymentAmount"] = float(value)
    if loan:
        params["loanName"] = loan.group(1).strip().title()
    return ScenarioProposal(
        scenario_type=ScenarioType.LOAN_PREPAYMENT.value,
        parameters=params,
        missing_fields=[] if value else ["prepayment_amount"],
        reason="User asked to simulate a loan prepayment",
        confidence=0.75 if value else 0.6,
    )


def _loan_emi(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    if "emi" not in lower:
        return None
    amt = re.search(_NUM, text)
    value = _amount_from(amt, 1, 2) if amt else None
    if value is None:
        return ScenarioProposal(
            scenario_type=ScenarioType.LOAN_EMI_CHANGE.value,
            parameters={},
            missing_fields=["new_emi"],
            reason="EMI scenario without an amount",
            confidence=0.6,
        )
    loan = re.search(r"\b([a-zA-Z ]+?)\s+loan\b", lower)
    params: dict = {"newEmi": float(value)}
    if loan:
        params["loanName"] = loan.group(1).strip().title()
    return ScenarioProposal(
        scenario_type=ScenarioType.LOAN_EMI_CHANGE.value,
        parameters=params,
        reason="User asked to simulate an EMI change",
        confidence=0.75,
    )


def _emergency_fund(text: str) -> ScenarioProposal | None:
    lower = text.lower()
    if not re.search(r"\bemergency\s+fund\b", lower):
        return None
    m = re.search(r"(\d{1,2})\s*(?:months?)", lower)
    if m:
        return ScenarioProposal(
            scenario_type=ScenarioType.EMERGENCY_FUND_TARGET_CHANGE.value,
            parameters={"targetMonths": int(m.group(1))},
            reason="User asked to simulate an emergency fund target",
            confidence=0.8,
        )
    return ScenarioProposal(
        scenario_type=ScenarioType.EMERGENCY_FUND_TARGET_CHANGE.value,
        parameters={},
        missing_fields=["target_months"],
        reason="Emergency fund scenario without a target",
        confidence=0.6,
    )


def _goal_deadline(text: str) -> ScenarioProposal | None:
    m = re.search(
        r"\bgoal\b.*?\bby\s+(\d{4})\b|\b(\d{4})\b.*?\bgoal\b",
        text,
        re.IGNORECASE,
    )
    if not m:
        return None
    year = m.group(1) or m.group(2)
    return ScenarioProposal(
        scenario_type=ScenarioType.GOAL_DEADLINE_CHANGE.value,
        parameters={"newTargetDate": f"{year}-12-31"},
        reason="User asked to simulate a goal deadline",
        confidence=0.6,
    )


def _purchase(text: str) -> ScenarioProposal | None:
    amt = re.search(_NUM, text)
    value = _amount_from(amt, 1, 2) if amt else None
    item = re.search(
        r"\b(?:afford|buy)\s+(?:an?\s+|the\s+|my\s+)?([a-zA-Z ]+?)"
        r"\s*(?:for|worth|costing|at|of|=|₹|rs\.?|that\s+costs|\d|$)",
        text,
        re.IGNORECASE,
    )
    params: dict = {}
    if value:
        params["purchaseAmount"] = float(value)
    if item:
        name = item.group(1).strip()
        if name and len(name) > 1 and name.lower() not in (
            "a", "an", "the", "it", "this", "that", "my", "new",
        ):
            params["itemName"] = name.title()
    if "itemName" not in params:
        # "a ₹2 lakh bike in 6 months" — item follows the amount.
        after = re.search(
            _NUM + r"\s+([a-zA-Z ]+?)\s*"
            r"(?:in\s+\d+\s*months?|a\s*month|per\s*month|[?.,!]|$)",
            text,
            re.IGNORECASE,
        )
        if after:
            name = after.group(3).strip()
            if name and len(name) > 1 and name.lower() not in (
                "a", "an", "the", "it", "this", "that", "my", "new",
            ):
                params["itemName"] = name.title()
    months = re.search(r"\bin\s+(\d{1,2})\s*months?", text, re.IGNORECASE)
    if months:
        params["monthsFromNow"] = int(months.group(1))
    return ScenarioProposal(
        scenario_type=ScenarioType.PURCHASE.value,
        parameters=params,
        missing_fields=[] if value else ["purchase_amount"],
        reason="User asked to simulate a purchase",
        confidence=0.8 if value else 0.6,
    )
