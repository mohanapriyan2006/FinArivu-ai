from __future__ import annotations

from datetime import datetime
from typing import Any

from app.financial.artifacts.schemas import Artifact, ArtifactType


class ArtifactBuilder:
    """Converts deterministic engine outputs into typed frontend artifacts."""

    @staticmethod
    def build(type_name: str, title: str, content: dict[str, Any]) -> Artifact:
        """Build a generic artifact from engine output."""
        return Artifact(type=type_name, title=title, content=content)

    @staticmethod
    def from_agent_data(agent_name: str, data: dict[str, Any]) -> Artifact | None:
        """Map an agent result to the correct artifact type."""
        # Lazy import — the registry pulls in the agent package which imports
        # ai.schemas; importing at module level creates a cycle.
        from app.ai.registry.registry import AgentName

        mapping: dict[str, str] = {
            AgentName.BUDGET.value: ArtifactType.BUDGET_CARD.value,
            AgentName.GOAL.value: ArtifactType.GOAL_CARD.value,
            AgentName.HEALTH.value: ArtifactType.HEALTH_CARD.value,
            AgentName.TAX.value: ArtifactType.TAX_CARD.value,
            AgentName.RETIREMENT.value: ArtifactType.RETIREMENT_CARD.value,
            AgentName.NETWORTH.value: ArtifactType.NETWORTH_CARD.value,
            AgentName.CASHFLOW.value: ArtifactType.CASHFLOW_CARD.value,
            AgentName.REPORT.value: ArtifactType.REPORT_CARD.value,
            AgentName.INSIGHT.value: ArtifactType.INSIGHT_CARD.value,
        }
        # Never visualise empty, errored, or missing-data payloads — the
        # response layer explains gaps in text instead.
        if not data:
            return None
        if data.get("error") or data.get("missing") or data.get("dataMissing"):
            return None
        artifact_type = mapping.get(agent_name)
        if artifact_type is None:
            # Unknown/unmapped agents never produce visual artifacts.
            return None
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
    def build_line_chart(labels: list[str], datasets: list[dict[str, Any]], title: str = "") -> Artifact:
        return Artifact(
            type="line_chart",
            title=title,
            content={"labels": labels, "datasets": datasets},
        )

    @staticmethod
    def build_donut_chart(labels: list[str], data: list[float], title: str = "") -> Artifact:
        return Artifact(
            type="donut_chart",
            title=title,
            content={"labels": labels, "data": data},
        )

    @staticmethod
    def build_comparison_table(headers: list[str], rows: list[list[Any]], title: str = "") -> Artifact:
        return Artifact(
            type="comparison_table",
            title=title,
            content={"headers": headers, "rows": rows},
        )

    @staticmethod
    def build_progress_card(
        title: str,
        current: float,
        target: float,
        label: str = "",
    ) -> Artifact:
        percentage = (current / target * 100) if target > 0 else 0
        return Artifact(
            type="progress_card",
            title=title,
            content={"current": current, "target": target, "percentage": percentage, "label": label},
        )

    @staticmethod
    def build_timeline_card(
        title: str,
        events: list[dict[str, Any]],
    ) -> Artifact:
        return Artifact(
            type="timeline_card",
            title=title,
            content={"events": events},
        )

    @staticmethod
    def build_report_card(
        title: str,
        report_data: dict[str, Any],
        *,
        period: str = "monthly",
    ) -> Artifact:
        artifact_type = "weekly_report_card" if period == "weekly" else "monthly_report_card"
        return Artifact(
            type=artifact_type,
            title=title,
            content=report_data,
        )

    @staticmethod
    def build_artifact_list(
        agent_results: list[dict[str, Any]],
        allowed_types: list[str] | None = None,
    ) -> list[Artifact]:
        """Build a complete artifact list from a list of agent result dicts."""
        artifacts: list[Artifact] = []
        for r in agent_results:
            if not r.get("data") or r.get("error"):
                continue
            artifact = ArtifactBuilder.from_agent_data(r.get("agent_name", ""), r["data"])
            if artifact is None:
                continue
            if allowed_types is not None and artifact.type not in allowed_types:
                continue
            artifacts.append(artifact)
        return artifacts
