async def test_generate_weekly_report(async_client, auth_headers, test_user):
    response = await async_client.post(
        "/api/v1/reports/weekly", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "weekly_income" in data
    assert "weekly_expenses" in data
    assert "insights" in data


async def test_get_latest_weekly_report(async_client, auth_headers, test_user):
    # First generate a report
    await async_client.post("/api/v1/reports/weekly", headers=auth_headers)

    response = await async_client.get(
        "/api/v1/reports/weekly/latest", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data is not None
    assert "weekly_income" in data
