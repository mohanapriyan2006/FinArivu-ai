"""Deterministic natural-language action extractor.

A conservative, rule-based fallback for when the controller's LLM plan
does not emit a ``proposed_action``. It only fires on explicit change
verbs ("set", "add", "create", "update", "increase", "received") paired
with concrete values — it never guesses amounts or invents entities.

Everything it emits is still just an ``ActionProposal``: the action layer
validates, previews and requires user confirmation before any mutation.
"""

from __future__ import annotations

import re
from datetime import date, timedelta

from app.actions.action_types import ActionOperation
from app.actions.schemas import ActionProposal


_NUM = r"(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|k)?"
_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5,
    "june": 6, "july": 7, "august": 8, "september": 9, "october": 10,
    "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7,
    "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}
_INCOME_WORDS = (
    "salary|freelance|business|investment|rent|interest|dividend|bonus|gift"
)


_FILLER = {"my", "the", "a", "an", "monthly", "new"}


def _entity_name(raw: str) -> str:
    """Strip filler words from a captured entity name."""
    cleaned = raw.strip()
    return "" if cleaned.lower() in _FILLER else cleaned


def _amount(match: re.Match, num_group: int, suffix_group: int) -> float | None:
    """Parse an Indian-format amount with optional lakh/crore/k suffix."""
    raw = match.group(num_group)
    if raw is None:
        return None
    try:
        value = float(raw.replace(",", ""))
    except ValueError:
        return None
    suffix = (match.group(suffix_group) or "").lower()
    if suffix in ("lakh", "lac"):
        value *= 100_000
    elif suffix == "crore":
        value *= 10_000_000
    elif suffix == "k":
        value *= 1_000
    return value if value > 0 else None


def _incomplete_update(
    text: str,
    noun: str,
    operation: ActionOperation,
    missing_field: str,
    ref_field: str,
) -> ActionProposal | None:
    """Catch 'update my X <noun>' without an amount — ask for the value."""
    match = re.search(
        r"\b(?:update|change|set|increase|reduce|raise|lower)\s+"
        r"(?:my\s+|the\s+)?([a-zA-Z &]*?)\s*" + noun + r"\b",
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    name = _entity_name(match.group(1))
    missing = [missing_field] + ([] if name else [ref_field])
    return ActionProposal(
        operation=operation.value,
        arguments={ref_field: name} if name else {},
        reason="User asked to update a record",
        confidence=0.6,
        missing_fields=missing,
    )


def _day_word(text: str) -> date | None:
    lowered = text.lower()
    if "today" in lowered:
        return date.today()
    if "yesterday" in lowered:
        return date.today() - timedelta(days=1)
    return None


def _month_target(text: str) -> date | None:
    """'by December' → last day of that month (this year or next)."""
    match = re.search(r"\bby\s+(" + "|".join(_MONTHS) + r")\b", text.lower())
    if not match:
        return None
    month = _MONTHS[match.group(1)]
    today = date.today()
    year = today.year if month >= today.month else today.year + 1
    if month == 12:
        return date(year, 12, 31)
    return date(year, month + 1, 1) - timedelta(days=1)


def extract_action(message: str) -> ActionProposal | None:
    """Best-effort deterministic extraction of an ActionProposal.

    Returns ``None`` when the message is not an explicit change request.
    """
    text = message.strip()
    if not text:
        return None

    handlers = (
        _update_budget,
        _create_budget,
        _update_goal,
        _create_goal,
        _update_income,
        _create_income,
        _create_expense,
        _update_expense,
        # Incomplete proposals — produce NEEDS_INPUT clarifications.
        _create_expense_incomplete,
        _update_budget_incomplete,
        _update_goal_incomplete,
        _update_income_incomplete,
        _update_expense_incomplete,
    )
    for handler in handlers:
        proposal = handler(text)
        if proposal is not None:
            return proposal
    return None


# ── Budgets ────────────────────────────────────────────────────────────────


def _update_budget(text: str) -> ActionProposal | None:
    match = re.search(
        r"\b(?:set|change|update|reduce|increase|raise|lower)\s+"
        r"(?:my\s+|the\s+)?([a-zA-Z &]+?)\s+budget\s+to\s+" + _NUM,
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    amount = _amount(match, 2, 3)
    category = _entity_name(match.group(1))
    if amount is None:
        return None
    return ActionProposal(
        operation=ActionOperation.UPDATE_BUDGET.value,
        arguments={
            "monthlyLimit": amount,
            **({"categoryName": category} if category else {}),
        },
        reason="User asked to change a budget limit",
        confidence=0.9,
        missing_fields=[] if category else ["categoryName"],
    )


def _update_budget_incomplete(text: str) -> ActionProposal | None:
    return _incomplete_update(
        text, "budget", ActionOperation.UPDATE_BUDGET,
        "monthlyLimit", "categoryName",
    )


def _create_budget(text: str) -> ActionProposal | None:
    match = re.search(
        r"\b(?:create|add|set up|start)\s+(?:a\s+|an\s+|my\s+)?"
        r"(?:new\s+)?([a-zA-Z &]*?)\s*budget\s+(?:of|at|for|to)\s+" + _NUM,
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    amount = _amount(match, 2, 3)
    category = match.group(1).strip()
    if amount is None:
        return None
    arguments: dict = {"monthlyLimit": amount}
    missing: list[str] = []
    if category:
        arguments["categoryName"] = category
    else:
        missing.append("categoryName")
    return ActionProposal(
        operation=ActionOperation.CREATE_BUDGET.value,
        arguments=arguments,
        reason="User asked to create a budget",
        confidence=0.9,
        missing_fields=missing,
    )


# ── Goals ──────────────────────────────────────────────────────────────────


def _update_goal(text: str) -> ActionProposal | None:
    match = re.search(
        r"\b(?:increase|update|change|set|raise|reduce)\s+(?:my\s+|the\s+)?"
        r"([a-zA-Z &]+?)\s+goal\s+to\s+" + _NUM,
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    amount = _amount(match, 2, 3)
    name = _entity_name(match.group(1))
    if amount is None:
        return None
    return ActionProposal(
        operation=ActionOperation.UPDATE_GOAL.value,
        arguments={
            "targetAmount": amount,
            **({"goalName": name} if name else {}),
        },
        reason="User asked to change a goal target",
        confidence=0.9,
        missing_fields=[] if name else ["goalName"],
    )


def _update_goal_incomplete(text: str) -> ActionProposal | None:
    return _incomplete_update(
        text, "goal", ActionOperation.UPDATE_GOAL,
        "targetAmount", "goalName",
    )


def _create_goal(text: str) -> ActionProposal | None:
    match = re.search(
        r"\b(?:create|add|set up|start)\s+(?:a\s+|an\s+)?(?:new\s+)?goal\s+"
        r"(?:called\s+|named\s+|for\s+|to\s+save\s+)?(.*)",
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    rest = match.group(1).strip()

    amount_match = re.search(_NUM, rest)
    amount = _amount(amount_match, 1, 2) if amount_match else None

    # "save ₹75,000 for a laptop" / "₹90,000 laptop goal"
    name = ""
    name_match = re.search(
        r"\bfor\s+(?:a\s+|an\s+|my\s+)?([a-zA-Z ]+?)(?:\s+by\s+|\s*$)", rest,
        re.IGNORECASE,
    )
    if name_match:
        name = name_match.group(1).strip()
    if not name:
        # fall back to the trailing words after the amount
        tail = re.sub(_NUM, "", rest).strip()
        tail = re.sub(r"\bto\b|\bsave\b|\bof\b", "", tail, flags=re.IGNORECASE)
        tail = re.sub(r"\bby\s+.*$", "", tail, flags=re.IGNORECASE).strip()
        name = tail

    missing: list[str] = []
    arguments: dict = {}
    if name:
        arguments["goalName"] = name
    else:
        missing.append("goalName")
    if amount is not None:
        arguments["targetAmount"] = amount
    else:
        missing.append("targetAmount")
    target = _month_target(text)
    if target:
        arguments["targetDate"] = target.isoformat()
    return ActionProposal(
        operation=ActionOperation.CREATE_GOAL.value,
        arguments=arguments,
        reason="User asked to create a savings goal",
        confidence=0.85,
        missing_fields=missing,
    )


# ── Income ─────────────────────────────────────────────────────────────────


def _update_income(text: str) -> ActionProposal | None:
    match = re.search(
        r"(?:my\s+)?(?:recurring\s+)?(" + _INCOME_WORDS + r"|income)"
        r"\s+(?:is\s+now|to)\s+" + _NUM,
        text,
        re.IGNORECASE,
    )
    if not match or not re.search(r"\b(?:update|change|set|now|increase|raise)\b", text, re.IGNORECASE):
        return None
    amount = _amount(match, 2, 3)
    if amount is None:
        return None
    source = match.group(1).strip().lower()
    if source == "income":
        # Prefer a concrete source word elsewhere in the message.
        specific = re.search(r"\b(" + _INCOME_WORDS + r")\b", text, re.IGNORECASE)
        source = specific.group(1).lower() if specific else ""
    arguments: dict = {"amount": amount}
    missing: list[str] = []
    if source:
        arguments["source"] = source
    else:
        missing.append("source")
    return ActionProposal(
        operation=ActionOperation.UPDATE_INCOME.value,
        arguments=arguments,
        reason="User asked to update an income record",
        confidence=0.9,
        missing_fields=missing,
    )


def _create_income(text: str) -> ActionProposal | None:
    match = re.search(
        r"\b(?:i\s+)?(?:received|got|earned|added?)\s+" + _NUM
        + r"(?:\s+(" + _INCOME_WORDS + r"))?",
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    amount = _amount(match, 1, 2)
    if amount is None:
        return None
    arguments: dict = {
        "amount": amount,
        "source": (match.group(3) or "salary").strip().title(),
    }
    day = _day_word(text)
    if day:
        arguments["incomeDate"] = day.isoformat()
    return ActionProposal(
        operation=ActionOperation.CREATE_INCOME.value,
        arguments=arguments,
        reason="User reported receiving income",
        confidence=0.9,
    )


# ── Expenses ───────────────────────────────────────────────────────────────


def _create_expense(text: str) -> ActionProposal | None:
    match = re.search(
        r"\b(?:add|log|record|spent)\s+(?:an?\s+|my\s+)?"
        r"(?:new\s+|recurring\s+)?(?:expense\s+)?(?:of\s+)?" + _NUM
        + r"\s+(?:for|on|towards?|to)\s+([a-zA-Z &]+)",
        text,
        re.IGNORECASE,
    )
    if not match:
        # "add a ₹2,000 recurring transport expense"
        alt = re.search(
            r"\b(?:add|log|record)\s+(?:an?\s+)?(?:new\s+)?" + _NUM
            + r"\s+(recurring\s+)?([a-zA-Z &]+?)\s+expense",
            text,
            re.IGNORECASE,
        )
        if not alt:
            return None
        amount = _amount(alt, 1, 2)
        category = alt.group(4).strip()
        recurring = bool(alt.group(3))
        if amount is None or not category:
            return None
        arguments: dict = {
            "amount": amount,
            "categoryName": category,
            "isRecurring": recurring,
        }
        day = _day_word(text)
        if day:
            arguments["expenseDate"] = day.isoformat()
        return ActionProposal(
            operation=ActionOperation.CREATE_EXPENSE.value,
            arguments=arguments,
            reason="User asked to log an expense",
            confidence=0.9,
        )

    amount = _amount(match, 1, 2)
    category = match.group(3).strip()
    if amount is None or not category:
        return None
    arguments = {
        "amount": amount,
        "categoryName": re.sub(r"\s+(today|yesterday)$", "", category, flags=re.IGNORECASE),
        "isRecurring": "recurring" in text.lower(),
    }
    day = _day_word(text)
    if day:
        arguments["expenseDate"] = day.isoformat()
    return ActionProposal(
        operation=ActionOperation.CREATE_EXPENSE.value,
        arguments=arguments,
        reason="User asked to log an expense",
        confidence=0.9,
    )


def _create_expense_incomplete(text: str) -> ActionProposal | None:
    """'Add ₹2000' — an expense verb + amount but no category → clarify."""
    match = re.search(
        r"\b(?:add|log|record|spent)\s+(?:an?\s+|my\s+)?"
        r"(?:new\s+|recurring\s+)?(?:expense\s+)?(?:of\s+)?" + _NUM + r"\b",
        text,
        re.IGNORECASE,
    )
    if match:
        amount = _amount(match, 1, 2)
        if amount is None:
            return None
        return ActionProposal(
            operation=ActionOperation.CREATE_EXPENSE.value,
            arguments={"amount": amount},
            reason="User asked to log an expense",
            confidence=0.7,
            missing_fields=["categoryName"],
        )

    # 'Add an expense' — verb with no amount or category at all.
    if re.search(
        r"\b(?:add|log|record)\s+(?:an?\s+|my\s+)?(?:new\s+|recurring\s+)?expense\b",
        text,
        re.IGNORECASE,
    ):
        return ActionProposal(
            operation=ActionOperation.CREATE_EXPENSE.value,
            arguments={},
            reason="User asked to log an expense",
            confidence=0.6,
            missing_fields=["amount", "categoryName"],
        )
    return None


def _update_expense(text: str) -> ActionProposal | None:
    match = re.search(
        r"\b(?:update|change|set)\s+(?:my\s+|the\s+)?([a-zA-Z &]+?)\s+expense"
        r"\s+to\s+" + _NUM,
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    amount = _amount(match, 2, 3)
    category = _entity_name(match.group(1))
    if amount is None:
        return None
    return ActionProposal(
        operation=ActionOperation.UPDATE_EXPENSE.value,
        arguments={
            "amount": amount,
            **({"categoryName": category} if category else {}),
        },
        reason="User asked to update an expense",
        confidence=0.85,
        missing_fields=[] if category else ["categoryName"],
    )


def _update_expense_incomplete(text: str) -> ActionProposal | None:
    return _incomplete_update(
        text, "expense", ActionOperation.UPDATE_EXPENSE,
        "amount", "categoryName",
    )


def _update_income_incomplete(text: str) -> ActionProposal | None:
    return _incomplete_update(
        text, r"(?:income|" + _INCOME_WORDS + r")", ActionOperation.UPDATE_INCOME,
        "amount", "source",
    )
