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

## Money Radar — `/api/v1/money-radar`

Deterministic, evidence-backed proactive insights. Detectors run only
where real data exists; lifecycle is `ACTIVE → SEEN → DISMISSED` with
auto-`RESOLVED` when the condition clears. See
`backend/docs/MONEY-RADAR.md`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan` | Run all supported detectors |
| GET | `/summary` | Last scan snapshot (auto-scans first use) |
| GET | `/insights` | Filtered/paginated insight history |
| GET | `/insights/{id}` | Detail — evidence, source, freshness, actions |
| POST | `/insights/{id}/seen` | Mark seen (idempotent) |
| POST | `/insights/{id}/dismiss` | Dismiss (idempotent) |

## Financial Action Plan — `/api/v1/action-plan`

The deterministic weekly plan built from active Radar insights — at most
5 focused items, each with evidence, provenance and typed next steps.
Lifecycle is `PENDING → IN_PROGRESS → COMPLETED` with `SNOOZED` /
`DISMISSED` / `EXPIRED` branches; plan generation never mutates financial
records. See `backend/docs/FINANCIAL-ACTION-PLAN.md`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/current?refresh=` | Current week's plan (auto-generates) |
| POST | `/generate` | Reconcile against a fresh Radar scan |
| GET | `/history` | Past plan periods (read-only) |
| GET | `/items/{id}` | Plan item detail |
| POST | `/items/{id}/accept` | Mark in-progress |
| POST | `/items/{id}/snooze` | `{option: LATER_TODAY\|TOMORROW\|NEXT_WEEK}` |
| POST | `/items/{id}/dismiss` | Dismiss (source insight untouched) |
| POST | `/items/{id}/complete` | Complete; optional `{executionId}` audit link |
| POST | `/items/from-insight` | Add a Radar insight to the plan (deduped) |

## Financial Data Ingestion — `/api/v1/imports`

Document import pipeline — extract → detect → normalize → **review** →
explicit confirm → commit → recompute → Radar refresh + Plan reconcile.
Uploading never mutates financial data; only `/confirm` with the current
`confirmToken` applies candidates (any candidate edit rotates the token).
Raw file bytes are never stored — only content hash + provenance.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `` | Upload document (multipart `file`, optional `document_type`) → preview |
| POST | `/from-text` | Ingest pre-extracted text `{fileName, content, mimeType?, documentType?}` |
| GET | `` | Import history (`skip`, `limit`) |
| GET | `/{id}` | Batch detail |
| GET | `/{id}/preview` | Candidates + detected fields + counts + confirmToken |
| POST | `/{id}/candidates/{cid}` | Review one candidate `{decision?, editedValue?}` |
| POST | `/{id}/confirm` | Apply — `{confirmToken}` must match the last preview |
| POST | `/{id}/cancel` | Discard a pending import |
| GET | `/{id}/changes` | Post-apply result — counts, changed domains, recompute flags |

Controlled errors: `UNSUPPORTED_FORMAT`, `UNREADABLE_DOCUMENT`,
`EMPTY_DOCUMENT`, `AMBIGUOUS_DOCUMENT`, `DUPLICATE_IMPORT` (409, carries
`existingBatchId`), `STALE_PREVIEW` (409), `ALREADY_APPLIED`,
`ALREADY_CANCELLED`, `INVALID_CANDIDATE`, `INVALID_VALUE`,
`FILE_TOO_LARGE`. See `backend/docs/DATA-INGESTION.md`.

## Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | AI provider health |
| GET | `/providers` | Configured providers |
| GET | `/metrics` | In-memory metrics |
| GET | `/session` | Session state |
| DELETE | `/session` | Clear session |
