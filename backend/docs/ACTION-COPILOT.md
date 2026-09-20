# Copilot Action Architecture (Phase 1)

Copilot can now execute **explicitly confirmed** financial mutations.
The LLM never touches the database — it proposes; the action layer
validates, previews, and only the user confirms.

## Pipeline

```
user message
  → controller plan / deterministic extractor   (ActionProposal)
  → ActionService.preview()                     (validate + resolve + snapshot)
  → copilot_action_executions row               (AWAITING_CONFIRMATION)
  → user confirms → POST /actions/execute       (staleness + expiry checks)
  → domain service mutation                     (atomic, user-scoped)
  → post-state + deterministic engine metrics   (impact before/after)
  → audit_logs row + conversation message
```

## Operations

Registered once in `app/actions/registry.py`:

`CREATE_EXPENSE` `UPDATE_EXPENSE` `CREATE_BUDGET` `UPDATE_BUDGET`
`CREATE_GOAL` `UPDATE_GOAL` `CREATE_INCOME` `UPDATE_INCOME`

No destructive deletes are exposed. Every operation is user-scoped,
confirmation-required, and undoable while the record is unchanged since
execution.

## Endpoints

All under `/v1/copilot/actions` (JWT required):

| Method | Path | Purpose |
|---|---|---|
| POST | `/preview` | Validate → snapshot → `AWAITING_CONFIRMATION` (never mutates) |
| POST | `/execute` | Confirm a preview by `executionId` — idempotent |
| POST | `/{id}/cancel` | Cancel a pending preview |
| POST | `/{id}/undo` | Reverse an executed action if still unchanged |
| GET | `/history` | User-scoped action history |

`execute` accepts only `{executionId, confirmation: true}` — the client
cannot send a fresh action payload at execution time.

## Safety model

- **Validation** — typed Pydantic args per operation; unknown operations
  rejected; missing fields → `NEEDS_INPUT` clarification.
- **Ownership** — entities resolved per-user; cross-user ids →
  `ENTITY_NOT_FOUND`.
- **Staleness** — `state_hash` of the previewed entity; drift →
  `STALE_PREVIEW` (409).
- **Expiry** — `expires_at` = now + `ACTION_PREVIEW_TTL_SECONDS` (300s);
  expired previews → `EXPIRED_ACTION` (410).
- **Idempotency** — re-executing an `EXECUTED` row returns the stored
  result; `idempotency_key` is unique.
- **Audit** — `audit_logs` rows for execute/cancel/undo; minimal metadata,
  never prompts/tokens/secrets.
- **Undo** — create → soft-delete; update → restore `before_state`;
  refused if the record changed since (`NOT_REVERSIBLE`/`STALE_PREVIEW`).

## Error codes

`INVALID_ACTION` `INVALID_ARGUMENTS` `ENTITY_NOT_FOUND`
`ENTITY_NOT_OWNED` `AMBIGUOUS_ENTITY` `STALE_PREVIEW` `EXPIRED_ACTION`
`ALREADY_EXECUTED` `NOT_REVERSIBLE` `EXECUTION_FAILED`
`CONFIRMATION_REQUIRED`

## Frontend contract

`src/types/actions.ts` mirrors the wire contract (camelCase).
`ActionPreviewCard` renders `before → after` diffs + deterministic impact
and gates mutation behind Confirm/Cancel. `ActionResultCard` shows the
applied change + Undo. `ActionHistorySheet` lists the audit surface.
`API_ACTION` suggested chips carry `{operation, arguments}` and open the
preview flow — never execute directly.

## Deferred (Phase 2+)

AI-generated UI artifact schemas, action templates, dry-run endpoint,
bulk preview mode, and the Action Center surface.
