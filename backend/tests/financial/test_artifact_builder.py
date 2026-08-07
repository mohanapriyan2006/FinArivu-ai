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


def test_build_line_chart():
    a = ArtifactBuilder.build_line_chart(
        ["Jan", "Feb", "Mar"],
        [{"label": "Savings", "data": [100, 200, 300]}],
        title="Savings Trend",
    )
    assert a.type == "line_chart"
    assert a.content["labels"] == ["Jan", "Feb", "Mar"]
    assert a.content["datasets"][0]["data"] == [100, 200, 300]


def test_build_donut_chart():
    a = ArtifactBuilder.build_donut_chart(["Equity", "Debt"], [60.0, 40.0], title="Allocation")
    assert a.type == "donut_chart"
    assert a.content["data"] == [60.0, 40.0]


def test_build_progress_card():
    a = ArtifactBuilder.build_progress_card("Emergency Fund", 50000, 100000, label="50% done")
    assert a.type == "progress_card"
    assert a.content["current"] == 50000
    assert a.content["target"] == 100000
    assert a.content["percentage"] == 50.0


def test_build_timeline_card():
    events = [{"date": "2025-01", "event": "Started SIP"}, {"date": "2025-06", "event": "Reached 50%"}]
    a = ArtifactBuilder.build_timeline_card("Goal Timeline", events)
    assert a.type == "timeline_card"
    assert len(a.content["events"]) == 2


def test_build_report_card_monthly():
    a = ArtifactBuilder.build_report_card("Monthly Report", {"health": 80}, period="monthly")
    assert a.type == "monthly_report_card"
    assert a.content["health"] == 80


def test_build_report_card_weekly():
    a = ArtifactBuilder.build_report_card("Weekly Report", {"health": 80}, period="weekly")
    assert a.type == "weekly_report_card"


def test_build_artifact_list():
    results = [
        {"agent_name": "HealthAgent", "data": {"score": 80}, "error": False},
        {"agent_name": "UnknownAgent", "data": {"x": 1}, "error": False},
        {"agent_name": "BudgetAgent", "data": None, "error": False},
    ]
    artifacts = ArtifactBuilder.build_artifact_list(results)
    assert len(artifacts) == 2
    assert artifacts[0].type == "health_card"
