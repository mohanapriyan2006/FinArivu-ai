from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class Artifact(BaseModel):
    """Structured UI artifact returned to the React Native frontend."""

    type: str
    title: str
    content: dict[str, Any] = Field(default_factory=dict)


class ChartDataset(BaseModel):
    label: str
    data: list[float]


class BarChartArtifact(BaseModel):
    labels: list[str]
    datasets: list[ChartDataset]


class PieChartArtifact(BaseModel):
    labels: list[str]
    data: list[float]


class LineChartArtifact(BaseModel):
    labels: list[str]
    datasets: list[ChartDataset]


class DonutChartArtifact(BaseModel):
    labels: list[str]
    data: list[float]
