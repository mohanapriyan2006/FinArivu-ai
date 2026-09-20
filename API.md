# FinArivu Copilot API

All endpoints are under `/api/v1/copilot`.

## Chat

### `POST /chat`

Synchronous chat. Returns the full structured response.

**Request**

```json
{
  "session_id": "session_123",
  "message": "How is my budget?",
  "context_hints": []
}
```

**Response** (`200 OK`)

```json
{
  "success": true,
  "message": "Response generated",
  "data": {
    "messageId": "...",
    "message": "...",
    "summary": "...",
    "intent": "budget_analysis",
    "artifacts": [...],
    "recommendations": [...],
    "followUpQuestions": [...],
    "suggestedActions": [...],
    "metadata": {
      "intent": "budget_analysis",
      "agentsUsed": ["BudgetAgent"],
      "provider": "gemini",
      "executionTimeMs": 1200
    }
  }
}
```

### `POST /chat/stream`

Server-Sent Events stream.

Event types: `agent_done`, `data`, `token`, `error`, `done`.

## History

### `GET /history`

Query params: `session_id`, `skip`, `limit`.

Returns paginated `AIMessage` history.

## Feedback

### `POST /feedback`

```json
{
  "message_id": "...",
  "rating": 5,
  "comment": "Very helpful"
}
```

## Copilot Actions — `/api/v1/copilot/actions`

Preview → confirm → execute for safe, user-confirmed CRUD changes. See
`backend/docs/ACTION-COPILOT.md`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/preview` | Validate + snapshot; returns `executionId` |
| POST | `/execute` | Confirm by `executionId` (idempotent) |
| POST | `/{id}/cancel` | Cancel a pending preview |
| POST | `/{id}/undo` | Undo an executed action |
| GET | `/history` | User-scoped action history |

## Scenario Lab — `/api/v1/scenarios`

Deterministic what-if simulations over real user data. Never mutates
financial records. See `backend/docs/SCENARIO-LAB.md`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/types` | Supported scenario types + required params |
| POST | `/run` | Compute a simulation |
| POST | `/save` | Run and persist to history |
| POST | `/compare` | Side-by-side comparison (≤3) |
| GET | `/` | List saved scenarios |
| GET | `/{id}` | Fetch a saved scenario |
| POST | `/{id}/rerun` | Re-run on current data |
| DELETE | `/{id}` | Delete a saved scenario |

## Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | AI provider health |
| GET | `/providers` | Configured providers |
| GET | `/metrics` | In-memory metrics |
| GET | `/session` | Session state |
| DELETE | `/session` | Clear session |
