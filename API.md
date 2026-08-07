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

## Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | AI provider health |
| GET | `/providers` | Configured providers |
| GET | `/metrics` | In-memory metrics |
| GET | `/session` | Session state |
| DELETE | `/session` | Clear session |
