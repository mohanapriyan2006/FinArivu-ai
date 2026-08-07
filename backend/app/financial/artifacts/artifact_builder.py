from __future__ import annotations

from datetime import datetime
from typing import Any

from app.financial.artifacts.schemas import Artifact


class ArtifactBuilder:
    """Converts deterministic engine outputs into typed frontend artifacts."""

    @staticmethod
    def build(type_name: str, title: str, content: dict[str, Any]) -> Artifact:
        """Build a generic artifact from engine output."""
        return Artifact(type=type_name, title=title, content=content)

    @staticmethod
    def from_agent_data(agent_name: str, data: dict[str, Any]) -> Artifact:
        """Map an agent result to the correct artifact type."""
        mapping: dict[str, str] = {
            "BudgetAgent": "budget_card",
            "GoalAgent": "goal_card",
            "HealthAgent": "health_card",
            "TaxAgent": "tax_card",
            "RetirementAgent": "retirement_card",
            "NetWorthAgent": "networth_card",
            "CashFlowAgent": "cashflow_card",
            "ReportAgent": "report_card",
            "InsightAgent": "insight_card",
            "RecommendationAgent": "recommendation_card",
        }
        artifact_type = mapping.get(agent_name, "insight_card")
        title = agent_name.replace("Agent", "")
        return Artifact(type=artifact_type, title=title, content=data)

    @staticmethod
    def from_report(report: dict[str, Any]) -> list[Artifact]:
        """Convert a report result into a list of artifacts."""
        artifacts: list[Artifact] = []
        for section in report.get("sections", []):
            artifacts.append(
                Artifact(
                    type=section.get("type", "insight_card"),
                    title=section.get("title", "Report"),
                    content=section.get("data", {}),
                )
            )
        return artifacts

    @staticmethod
    def build_pie_chart(labels: list[str], data: list[float], title: str = "") -> Artifact:
        return Artifact(type="pie_chart", title=title, content={"labels": labels, "data": data})

    @staticmethod
    def build_bar_chart(labels: list[str], datasets: list[dict[str, Any]], title: str = "") -> Artifact:
        return Artifact(type="bar_chart", title=title, content={"labels": labels, "datasets": datasets})

    @staticmethod
    def build_comparison_table(headers: list[str], rows: list[list[Any]], title: str = "") -> Artifact:
        return Artifact(
            type="comparison_table",
            title=title,
            content={"headers": headers, "rows": rows},
        )
