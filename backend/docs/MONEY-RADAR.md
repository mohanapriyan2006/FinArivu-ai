# Money Radar Architecture (Phase 3)

Money Radar is the **deterministic detection layer** of the proactive
intelligence pipeline. It watches the user's real financial records and
produces evidence-backed insights — never fabricated, never computed by an
LLM. The Insights tab in the app renders this surface.

```
Financial Data → RadarContext (one load per scan)
  → enabled detectors (registry-declared required domains only)
  → fingerprint + dedup / upsert → money_radar_insights
  → resolve stale open insights → money_radar_scans (summary)
  → RadarSummary → UI card / copilot artifact
```

## Pipeline

`POST /v1/money-radar/scan` (or `GET /summary` on first use):

1. `RadarContextBuilder` loads income, expense windows (current month +
   3-month baseline), budgets, goals, loans, savings, tax profile and net
   worth — via `FinancialProfileService` + repositories. Missing domains
   are marked `MISSING`, never defaulted.
2. `MoneyRadarService` runs each detector whose `required_domains` are all
   `AVAILABLE`. A detector that lacks data simply does not run — its gap
   surfaces in `coverage`.
3. Each finding is fingerprinted
   (`user | type | entity | detector_version | state_key`) and upserted.
   The `state_key` bucket means a materially changed condition creates a
   new insight instance; an identical condition deduplicates.
4. Open insights (`ACTIVE`/`SEEN`) from detectors that ran but produced no
   matching fingerprint are resolved automatically.
5. Counts + coverage persist to `money_radar_scans` for cheap `GET
   /summary` reads.

## Insight types

Registered once in `app/money_radar/registry.py` (`INSIGHT_REGISTRY`):

`SPENDING_SPIKE` `BUDGET_RISK` `CASHFLOW_RISK` `GOAL_DELAY`
`DEBT_OPPORTUNITY` `EMERGENCY_FUND_RISK` `TAX_OPPORTUNITY`
`RECURRING_COST` `NETWORTH_CHANGE`

Each entry declares: required domains, category, detector key + version,
entity type, source engines/repositories, and allowed action kinds.
Thresholds live centrally in `app/money_radar/thresholds.py`.

## Endpoints

All under `/v1/money-radar` (JWT required, user-scoped):

| Method | Path | Purpose |
|---|---|---|
| POST | `/scan` | Run all supported detectors |
| GET | `/summary` | Last scan snapshot (auto-scans on first use) |
| GET | `/insights` | Filtered/paginated history (`status`, `severity`, `insight_type`, `category`, `entity_type`, date range, `skip`/`limit`) |
| GET | `/insights/{id}` | Full detail — evidence, source, freshness, actions |
| POST | `/insights/{id}/seen` | `ACTIVE → SEEN` (idempotent) |
| POST | `/insights/{id}/dismiss` | `ACTIVE/SEEN → DISMISSED` (idempotent) |

## Safety model

- **Read-only** — scans never write to financial tables; a regression
  test asserts row counts are unchanged. The only writes are
  `money_radar_insights`, `money_radar_scans` and a daily
  `net_worth_history` snapshot used solely for change detection.
- **Deterministic** — every evidence number comes from a stored record or
  a deterministic engine (`GoalEngine`, `TaxEngine`, `BudgetEngine`,
  scenario `calculations`). The LLM is only the conversational layer.
- **Honest coverage** — missing domains mark detectors as skipped and
  appear in `coverage`; no insight is ever inferred from missing data.
- **Typed actions** — `VIEW` routes to a whitelisted screen,
  `RUN_SCENARIO` carries a `ScenarioPreset` posted verbatim to
  `/v1/scenarios/run`, `PREVIEW_ACTION` carries an `ActionIntent` posted
  to `/v1/copilot/actions/preview`. Nothing mutates without user confirm.
- **Dedup + lifecycle** — `ACTIVE → SEEN → DISMISSED`, plus automatic
  `RESOLVED` when the condition disappears. Dismissed insights stay
  dismissed unless the condition materially changes.

## Persistence

`money_radar_insights` — user-scoped rows with type/status/severity/
category, entity link, evidence + explanation JSON, typed actions, source
provenance, data-quality + freshness, fingerprint/state signature,
detector version and lifecycle timestamps. Unique `(user_id,
fingerprint)` guarantees dedup.

`money_radar_scans` — one row per user: `generated_at`, coverage JSON,
severity counts, radar version.

## Copilot integration

- `is_radar_request()` (deterministic keyword match) runs the scan before
  the controller when the user explicitly asks what needs attention.
- Controller-classified `money_radar` intent lands on the same path.
- Responses carry `responseType: money_radar_result`, a `money_radar_card`
  artifact, `data.moneyRadar` and a `money_radar` NAVIGATE action.

## Frontend

- `src/screens/moneyRadar/MoneyRadarScreen.tsx` replaces the old Insights
  tab (route name `Insights` kept for compatibility; label "Radar").
- `src/services/MoneyRadarService.ts`, `src/hooks/useMoneyRadar.ts`,
  `src/hooks/moneyRadarUiState.ts` (pure grouping/formatting helpers).
- `RadarDetailSheet` renders evidence + explanation + provenance and
  bridges `RUN_SCENARIO` → Scenario Lab preset auto-run and
  `PREVIEW_ACTION` → `ActionPreviewCard`/`ActionResultCard`.
- `MoneyRadarCard` renders the `money_radar_card` copilot artifact.

## Known limitations

- **NETWORTH_CHANGE** needs ≥2 `net_worth_history` snapshots ≥7 days
  apart; first scans only record today's snapshot, so it activates over
  time rather than on day one.
- **Spending spikes** require a populated baseline month; new accounts
  produce coverage gaps, not guesses.
- Insight → Action bridge currently covers `BUDGET_RISK` (UPDATE_BUDGET);
  other insight types bridge to Scenario Lab only.
- Detectors run on-demand (scan on open / explicit rescan / copilot ask) —
  there is no background scheduler yet.
