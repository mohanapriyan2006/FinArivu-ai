# Financial Action Plan (Phase 4)

> "What are the few financial things worth my attention right now — and
> what can I safely do about them?"

Phase 4 turns Money Radar detections into a small, evidence-backed weekly
plan. It sits between detection (Radar), evaluation (Scenario Lab) and
execution (Action Copilot):

```
Financial State → Money Radar → ACTION PLAN → Simulate → Preview → Confirm → Execute → Reconcile
```

---

## 1. Purpose

Money Radar answers *what changed*. The Action Plan answers *what to do
about it*. The plan is deliberately small — at most 5 active items — so
the user sees priorities, not a feed.

## 2. Architecture

| Component | Responsibility |
|---|---|
| `CandidateBuilder` | Map active Radar insights → `PlanCandidate` via the authoritative `INSIGHT_TO_PLAN` map |
| `PriorityPolicy` | Deterministic score → HIGH/MEDIUM/LOW band |
| `PlanSelector` | Top N (≤5) with cross-domain diversity cap |
| `FinancialActionPlanService` | Generation, reconciliation, lifecycle |
| `PlanReconciler` logic (in service) | Merge candidates with persisted rows; expire/resolve |

Nothing in this module calls an LLM or mutates financial records.

### Files

```
app/action_plan/
├── plan_types.py      # PlanStatus / PlanItemStatus / Priority / Category / Source / transitions
├── mapping.py         # INSIGHT_TO_PLAN — the single authoritative map
├── schemas.py         # PlanCandidate + wire models (camelCase)
├── pipeline.py        # CandidateBuilder, PriorityPolicy, PlanSelector, period+snooze resolvers
├── service.py         # FinancialActionPlanService — orchestration + reconciliation
├── errors.py          # PlanError with controlled PlanErrorCode
├── copilot.py         # deterministic copilot fast-path + artifact
└── router.py          # /v1/action-plan endpoints
app/models/action_plan.py          # FinancialActionPlan + FinancialPlanItem
app/repositories/action_plan.py    # user-scoped repositories
```

## 3. Domain model

```
FinancialActionPlan
  period_key "YYYY-Www" (unique per user)
  period_start / period_end (ISO week, Mon–Sun)
  status ACTIVE | COMPLETED | ARCHIVED
  summary, counts, generation_version, plan_version

FinancialPlanItem
  fingerprint (user + source + category + entity + insight id)
  category REVIEW_SPENDING | REVIEW_BUDGET | IMPROVE_CASHFLOW | REPLAN_GOAL |
           REVIEW_DEBT | BUILD_RESERVE | REVIEW_TAX | REVIEW_RECURRING_COST |
           REVIEW_NETWORTH | COMPLETE_PROFILE
  priority HIGH | MEDIUM | LOW
  status PENDING | IN_PROGRESS | COMPLETED | SNOOZED | DISMISSED | EXPIRED
  source_type RADAR | GOAL | BUDGET | CASHFLOW | ACTION_HISTORY | SYSTEM
  source_insight_id → money_radar_insights.id
  evidence, impact, why, actions, route, scenario_preset, action_preset
  due_window TODAY | THIS_WEEK | NEXT_WEEK
  completion_source USER | ACTION_EXECUTION | SYSTEM_RECONCILIATION
  linked_action_execution_id, linked_scenario_run_id
  snoozed_until, completed_at, dismissed_at, dismissed_count
```

## 4. Plan generation

1. Load current Money Radar summary (persisted) — or a fresh scan on
   `?refresh=true` / `POST /generate`.
2. `CandidateBuilder.from_insights` — active actionable insights only;
   `MISSING`/`UNSUPPORTED` data quality and EXPLAIN-only insights are
   filtered out (never plan on absent data).
3. `PriorityPolicy.score` — severity weight + impact magnitude +
   actionability + goal relevance − quality/staleness/dismissal penalties.
4. `PlanSelector.select` — score-ranked, ≤5 items, ≤2 per domain group
   (spending, cashflow, goals, debt, savings, tax, networth).
5. Reconcile against persisted rows — refresh open items, expire resolved
   sources, revive elapsed snoozes, insert genuinely new candidates.
6. Persist + return.

Repeated generation is stable: fingerprints dedup onto existing rows and
statuses are preserved.

## 5. Priority policy (deterministic)

```
score = severity_weight            (HIGH 40 / MEDIUM 25 / LOW 12 / INFO 4)
      + min(|impact.change|/5000, 15)
      + actionability              (PREVIEW_ACTION 15 / RUN_SCENARIO 10 / VIEW 4)
      + goal_relevance             (GOAL_DELAY +8)
      − data_quality penalty       (PARTIAL 5 / STALE 10 / MISSING∣UNSUPPORTED 100)
      − freshness penalty          (RECENT 2 / STALE 12 / UNKNOWN 4)
      − dismissal penalty          (15 per prior dismissal, max 30)

HIGH ≥ 45 · MEDIUM ≥ 22 · otherwise LOW
```

The UI only ever shows HIGH/MEDIUM/LOW — the score stays internal.

## 6. Lifecycle

```
PENDING → IN_PROGRESS → COMPLETED
PENDING → SNOOZED → PENDING   (after snoozeUntil AND source still active)
PENDING/IN_PROGRESS/SNOOZED → DISMISSED
open → EXPIRED                (snooze elapsed with resolved source)
open → COMPLETED              (source insight resolved → SYSTEM_RECONCILIATION)
```

Terminal states: COMPLETED, DISMISSED, EXPIRED — never re-opened by
reconciliation. A dismissed fingerprint is never re-created for the same
source insight; a *new* insight sharing the anti-noise signature gets a
score penalty instead.

## 7. Snooze / dismiss semantics

- **Snooze** = postpone. Fixed options `LATER_TODAY` (+8h), `TOMORROW`
  (+24h), `NEXT_WEEK` (next Monday UTC). Revives only if the underlying
  insight is still active — never resurrects resolved problems.
- **Dismiss** = remove from the plan. The source Radar insight is
  untouched; dismissal memory (`state_signature` + `dismissed_count`)
  penalises identical re-suggestions.

## 8. Bridges

- **Simulate** → `scenarioPreset` posted to Scenario Lab (Phase 2). A
  scenario run never completes the item.
- **Preview change** → `actionPreset` posted to
  `/v1/copilot/actions/preview` (Phase 1); on `EXECUTED` the client calls
  `/items/{id}/complete` with `executionId` → `completion_source =
  ACTION_EXECUTION`. A FAILED execution keeps the item open.
- **Review** → `route` through the canonical navigation whitelist.
- **View source** → `sourceInsightId` opens the Radar detail.

## 9. API

All under `/api/v1/action-plan`, JWT-required, user-scoped:

| Method | Path | Purpose |
|---|---|---|
| GET | `/current?refresh=` | Current plan (auto-generates) |
| POST | `/generate` | Force reconcile + fresh radar scan |
| GET | `/history` | Past periods (read-only) |
| GET | `/items/{id}` | Item detail |
| POST | `/items/{id}/accept` | PENDING → IN_PROGRESS |
| POST | `/items/{id}/snooze` | `{option}` → SNOOZED |
| POST | `/items/{id}/dismiss` | → DISMISSED |
| POST | `/items/{id}/complete` | `{executionId?}` → COMPLETED |
| POST | `/items/from-insight` | `{insightId}` Radar → Plan bridge |

## 10. Copilot

- Intent: `FINANCIAL_ACTION_PLAN` (aliases: `action_plan`,
  `financial_plan`, `plan`, `priorities`).
- ResponseType: `FINANCIAL_ACTION_PLAN_RESULT`.
- Artifact: `financial_action_plan_card` — compact top-3 list.
- Keyword fast-path ("what should I focus on this week?", "show my
  financial plan") runs before the LLM controller; classified intent
  follows the same deterministic path in both sync and streaming modes.

## 11. Security & safety

- Every query is `user_id`-scoped; cross-user ids → 404.
- The plan is read-only over financial records — verified by tests that
  count rows before/after generation.
- Only writes: `financial_action_plans`, `financial_action_plan_items`.
- All mutations go through Phase 1 preview → confirm → execute.

## 12. Testing

`tests/action_plan/` — 41 tests:

- `test_pipeline.py` — scoring bands, penalties, filters, dedup,
  selection caps/diversity, period resolver, snooze resolution.
- `test_service.py` — generation, idempotency, ≤5 cap, all-clear,
  per-period uniqueness, read-only guarantee, lifecycle transitions,
  snooze revival, dismissal persistence, source-resolution completion,
  Radar→Plan dedup, cross-user scoping.
- `test_plan_api.py` — auth, response contract, idempotent generate,
  lifecycle endpoints, invalid snooze rejection, 404s, history.

## 13. Limitations / deferred

- No bulk "apply all" — every mutation is independently previewed.
- No outcome ledger — completion metadata is stored, actual savings are
  not yet measured.
- Non-Radar candidate sources (goal/budget/action-history standalones)
  are reserved in the taxonomy but not yet emitting — all current items
  flow from Money Radar.
- Historical plans are read-only snapshots; no cross-period editing.
