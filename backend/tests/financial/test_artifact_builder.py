from app.financial.artifacts.artifact_builder import ArtifactBuilder


def test_build_pie_chart():
    a = ArtifactBuilder.build_pie_chart(["A", "B"], [10.0, 20.0], title="Spend")
    assert a.type == "pie_chart"
    assert a.content["labels"] == ["A", "B"]
    assert a.content["data"] == [10.0, 20.0]


def test_build_bar_chart():
    a = ArtifactBuilder.build_bar_chart(
        ["Jan", "Feb"],
        [{"label": "Income", "data": [1, 2]}],
        title="Income",
    )
    assert a.type == "bar_chart"
    assert a.content["datasets"][0]["data"] == [1, 2]


def test_build_comparison_table():
    a = ArtifactBuilder.build_comparison_table(
        ["Regime", "Tax"],
        [["Old", "10000"], ["New", "8000"]],
        title="Tax Compare",
    )
    assert a.type == "comparison_table"
    assert a.content["rows"][0] == ["Old", "10000"]


def test_build_artifact_list():
    results = [
        {"agent_name": "HealthAgent", "data": {"score": 80}, "error": False},
        {"agent_name": "UnknownAgent", "data": {"x": 1}, "error": False},
        {"agent_name": "BudgetAgent", "data": None, "error": False},
    ]
    artifacts = ArtifactBuilder.build_artifact_list(results)
    assert len(artifacts) == 2
    assert artifacts[0].type == "health_card"
