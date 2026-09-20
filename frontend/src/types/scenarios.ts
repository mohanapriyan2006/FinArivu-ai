/**
 * Canonical contract for the Scenario Lab (Phase 2).
 *
 * Mirrors `backend/app/scenarios/schemas.py` — the wire is camelCase.
 * Scenario runs are deterministic simulations over real user data; they
 * never mutate financial records. Applying a change always goes through
 * the Phase 1 action preview/confirmation flow.
 */

export type ScenarioType =
  | 'INCOME_CHANGE'
  | 'EXPENSE_CHANGE'
  | 'CATEGORY_SPENDING_CHANGE'
  | 'BUDGET_CHANGE'
  | 'MONTHLY_SAVINGS_CHANGE'
  | 'GOAL_CONTRIBUTION_CHANGE'
  | 'GOAL_TARGET_CHANGE'
  | 'GOAL_DEADLINE_CHANGE'
  | 'PURCHASE'
  | 'RETIREMENT_AGE_CHANGE'
  | 'INFLATION_CHANGE'
  | 'LOAN_PREPAYMENT'
  | 'LOAN_EMI_CHANGE'
  | 'EMERGENCY_FUND_TARGET_CHANGE'

export type ScenarioRunStatus =
  | 'COMPUTED'
  | 'NEEDS_INPUT'
  | 'INSUFFICIENT_DATA'
  | 'NOT_SUPPORTED'

export type MetricDirection =
  | 'IMPROVES'
  | 'WORSENS'
  | 'UNCHANGED'
  | 'INSUFFICIENT_DATA'

export type MetricUnit =
  | 'currency'
  | 'percent'
  | 'months'
  | 'date'
  | 'score'
  | 'count'

export type DataQuality = 'complete' | 'partial' | 'insufficient'

export interface ScenarioMetric {
  key: string
  label: string
  before: unknown
  after: unknown
  change: unknown
  unit: MetricUnit
  direction: MetricDirection
}

export interface ScenarioAssumption {
  key: string
  label: string
  value: unknown
  source: 'default' | 'user' | 'engine'
}

/** Phase 1 bridge — handed to POST /v1/copilot/actions/preview. */
export interface ScenarioApplyAction {
  operation: string
  arguments: Record<string, unknown>
  label: string
}

export interface ScenarioAlternative {
  label: string
  [key: string]: unknown
}

export interface ScenarioResult {
  scenarioId?: string | null
  scenarioType: ScenarioType | null
  title: string
  status: ScenarioRunStatus
  baseline: Record<string, unknown>
  scenario: Record<string, unknown>
  metrics: ScenarioMetric[]
  assumptions: ScenarioAssumption[]
  affectedDomains: string[]
  dataAvailable: string[]
  dataMissing: string[]
  dataQuality: DataQuality
  summary: string
  explanation: string[]
  applyAction?: ScenarioApplyAction | null
  alternatives: ScenarioAlternative[]
  missingFields: string[]
  clarificationQuestion?: string | null
  engineVersion: string
  generatedAt?: string | null
  simulatedAt?: string | null
}

export interface ScenarioHistoryItem {
  id: string
  scenarioType: ScenarioType
  title: string
  status: ScenarioRunStatus
  headline: string
  createdAt: string | null
  engineVersion: string
}

export interface ScenarioTypeInfo {
  type: ScenarioType
  label: string
  requiredParams: string[]
  paramLabels: Record<string, string>
  affectedDomains: string[]
  applyOperation: string | null
}

export interface ScenarioRunRequest {
  scenarioType: ScenarioType | string
  parameters: Record<string, unknown>
  title?: string
  sessionId?: string
}

export interface ScenarioCompareItem {
  scenarioType: ScenarioType | string
  parameters: Record<string, unknown>
  title?: string
}

export interface ScenarioCompareCell {
  after: unknown
  change: unknown
  direction: MetricDirection
}

export interface ScenarioCompareRow {
  key: string
  label: string
  unit: MetricUnit
  before: unknown
  cells: ScenarioCompareCell[]
}

export interface ScenarioCompareResult {
  titles: string[]
  rows: ScenarioCompareRow[]
  engineVersion: string
  generatedAt?: string | null
}
