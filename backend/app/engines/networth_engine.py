from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class NetWorthResult:
    """Net worth calculation result."""

    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    asset_breakdown: dict[str, Decimal]
    liability_breakdown: dict[str, Decimal]
    asset_count: int
    liability_count: int


def calculate_net_worth(
    assets: list[dict[str, Any]],
    liabilities: list[dict[str, Any]],
) -> NetWorthResult:
    """Calculate net worth from assets and liabilities."""
    total_assets = Decimal("0")
    asset_breakdown: dict[str, Decimal] = {}
    for asset in assets:
        value = Decimal(asset.get("value", 0))
        total_assets += value
        asset_type = str(asset.get("asset_type", "Other"))
        asset_breakdown[asset_type] = asset_breakdown.get(asset_type, Decimal("0")) + value

    total_liabilities = Decimal("0")
    liability_breakdown: dict[str, Decimal] = {}
    for liability in liabilities:
        amount = Decimal(liability.get("amount", 0))
        total_liabilities += amount
        liability_type = str(liability.get("liability_type", "Other"))
        liability_breakdown[liability_type] = liability_breakdown.get(liability_type, Decimal("0")) + amount

    return NetWorthResult(
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        net_worth=total_assets - total_liabilities,
        asset_breakdown=asset_breakdown,
        liability_breakdown=liability_breakdown,
        asset_count=len(assets),
        liability_count=len(liabilities),
    )
