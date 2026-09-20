# Scenario Lab Architecture (Phase 2)

The Scenario Lab runs **deterministic what-if simulations** over the user's
real financial data. The LLM never computes numbers — it can only propose a
scenario type and parameters; the engine is authoritative for every figure.

## Pipeline

```
user message ("what if I retire at 50?")
  → extract_scenario()                    (conservative NL → typed proposal)
  → ScenarioService.run()                 (validate type + typed params)
  → ScenarioContextBuilder                (real baseline from existing services)
  → ScenarioEngine                        (per-type deterministic math)
  → ScenarioRunResponse                   (baseline, scenario, metrics, assumptions)
  → scenario_card artifact + scenario_lab NAVIGATE action
```

## Scenario types

Registered once in `app/scenarios/registry.py` (`SCENARIO_REGISTRY`):

`INCOME_CHANGE` `EXPENSE_CHANGE` `CATEGORY_SPENDING_CHANGE` `BUDGET_CHANGE`
`MONTHLY_SAVINGS_CHANGE` `GOAL_CONTRIBUTION_CHANGE` `GOAL_TARGET_CHANGE`
`GOAL_DEADLINE_CHANGE` `PURCHASE` `RETIREMENT_AGE_CHANGE` `INFLATION_CHANGE`
`LOAN_PREPAYMENT` `LOAN_EMI_CHANGE` `EMERGENCY_FUND_TARGET_CHANGE`

Each registry entry declares: the typed params model, required parameters
(missing → `NEEDS_INPUT` with a targeted clarification question), required
baseline data (missing → `INSUFFICIENT_DATA`), affected domains, and an
optional **apply bridge** to a Phase 1 action operation.

## Endpoints

All under `/v1/scenarios` (JWT required, every query user-scoped):

| Method | Path | Purpose |
|---|---|---|
| GET | `/types` | Supported types + required params + labels |
| POST | `/run` | Compute a simulation — never mutates |
| POST | `/save` | Run and persist to scenario history |
| POST | `/compare` | Align metrics across ≤ `SCENARIO_MAX_COMPARE` runs |
| GET | `/` | List the user's saved scenarios |
| GET | `/{id}` | Fetch a saved run's result snapshot |
| POST | `/{id}/rerun` | Re-run stored inputs on today's baseline |
| DELETE | `/{id}` | Soft-delete a saved scenario |

## Safety model

- **Read-only** — simulations never write to financial tables. A
  regression test asserts records are unchanged after a run.
- **Typed parameters** — every type validates into a dedicated Pydantic
  model; arbitrary payloads are rejected.
- **Real baselines** — `ScenarioContext` is built from
  `FinancialProfileService` + repositories; the client cannot supply
  baseline values.
- **Disclosed assumptions** — inflation, return rate, withdrawal rate and
  heuristics are returned as typed `ScenarioAssumption` rows.
- **No invented data** — missing records produce `INSUFFICIENT_DATA` /
  `NEEDS_INPUT`, never substituted values.
- **Apply = Phase 1** — `applyAction` returns `{operation, arguments}` for
  `POST /v1/copilot/actions/preview`; the user confirms before any change.
- **Deterministic math** — compounding, amortisation and comparisons live
  in `app/scenarios/calculations.py` (Decimal arithmetic); metrics carry a
  computed `direction` (IMPROVES/WORSENS) — the LLM only explains them.

## Persistence

`scenario_runs` stores inputs, assumptions, baseline/result snapshots and
`engine_version` (`scenario_engine_v1`) so historical runs remain
interpretable if the engine evolves. Re-running uses stored parameters
against the current baseline; the stored snapshot is never overwritten.

## Configuration

`SCENARIO_MAX_COMPARE` (3), `SCENARIO_PROJECTION_HORIZON_YEARS` (10),
`SCENARIO_ANNUAL_RETURN_RATE` (0.08), `SCENARIO_INFLATION_RATE` (0.06),
`SCENARIO_SAFE_WITHDRAWAL_RATE` (0.04), `SCENARIO_MAX_PURCHASE_MONTHS` (24).

## Copilot integration

- `extract_scenario()` fires only on explicit simulation phrasing
  ("what if", "can I afford", "simulate") with concrete values; document
  attachment text is stripped first.
- Responses carry `responseType: scenario_result`, a `scenario_card`
  artifact, `scenarioResult` payload, and a `scenario_lab` NAVIGATE action.
- The frontend renders `ScenarioResultCard` (metric diffs + assumptions)
  and bridges `applyAction` into the standard action preview card.
