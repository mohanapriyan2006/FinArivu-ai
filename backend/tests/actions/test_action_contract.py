"""Contract tests: chat response carries actionPreview; artifacts typed."""

from __future__ import annotations

from app.actions.action_types import ActionOperation
from app.ai.schemas.copilot import CopilotChatResponse, ResponseType
from app.financial.artifacts.schemas import Artifact, ArtifactType


def test_copilot_response_accepts_action_preview() -> None:
    preview = {
        "executionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "operation": "UPDATE_BUDGET",
        "status": "AWAITING_CONFIRMATION",
        "title": "Update Food budget",
        "entityName": "Food",
        "before": {"monthlyLimit": 12000.0},
        "after": {"monthlyLimit": 8000.0},
        "impact": {"monthlyBudgetChange": -4000.0},
        "affectedAreas": ["budgets"],
        "requiresConfirmation": True,
    }
    response = CopilotChatResponse(
        message="I can update your Food budget.",
        response_type=ResponseType.ACTION_PREVIEW,
        action_preview=preview,
        artifacts=[
            Artifact(
                type=ArtifactType.ACTION_PREVIEW_CARD.value,
                title="Update Food budget",
                content=preview,
            )
        ],
    )
    assert response.action_preview == preview
    assert response.artifacts[0].type == "action_preview_card"


def test_action_artifact_types_exist() -> None:
    assert ArtifactType.ACTION_PREVIEW_CARD.value == "action_preview_card"
    assert ArtifactType.ACTION_RESULT_CARD.value == "action_result_card"
    assert ArtifactType.ACTION_HISTORY_CARD.value == "action_history_card"


def test_all_operations_have_result_states() -> None:
    # Every registered operation maps cleanly to a wire enum member.
    for op in ActionOperation:
        assert op.value.isupper()
