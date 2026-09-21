/**
 * Canonical contract for Money Radar (Phase 3).
 *
 * Mirrors `backend/app/money_radar/schemas.py` — the wire is camelCase.
 * Insights are deterministic, evidence-backed detections over real user
 * data. The client never computes financial truth; it renders what the
 * detectors produced and hands off to Scenario Lab / Action Copilot.
 */

export type InsightType =
  | 'SPENDING_SPIKE'
  | 'BUDGET_RISK'
  | 'CASHFLOW_RISK'
  | 'GOAL_DELAY'
  | 'DEBT_OPPORTUNITY'
  | 'EMERGENCY_FUND_RISK'
  | 'TAX_OPPORTUNITY'
  | 'RECURRING_COST'
  | 'NETWORTH_CHANGE'

export type InsightStatus = 'ACTIVE' | 'SEEN' | 'DISMISSED' | 'RESOLVED'

export type InsightSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH'

export type InsightCategory =
  | 'spending'
  | 'budget'
  | 'cash_flow'
  | 'goals'
  | 'debt'
  | 'savings'
  | 'tax'
  | 'net_worth'

export type InsightActionKind =
  | 'VIEW'
  | 'EXPLAIN'
  | 'RUN_SCENARIO'
  | 'PREVIEW_ACTION'

export type DataAvailability =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'STALE'
  | 'MISSING'
  | 'UNSUPPORTED'

export type FreshnessStatus = 'FRESH' | 'RECENT' | 'STALE' | 'UNKNOWN'

export interface EvidenceItem {
  key: string
  label: string
  value?: unknown
  unit?: string | null
  source?: string | null
}

export interface DataFreshness {
  updatedAt?: string | null
  ageDays?: number | null
  status: FreshnessStatus
}

export interface InsightSource {
  detector: string
  detectorVersion: string
  engines: string[]
  repositories: string[]
}

export interface InsightImpact {
  metricLabel: string
  before?: unknown
  after?: unknown
  change?: unknown
  unit?: string | null
  description: string
}

/** Phase 2 handoff — posted verbatim to POST /v1/scenarios/run. */
export interface ScenarioPreset {
  scenarioType: string
  parameters: Record<string, unknown>
  title: string
  sourceInsightId?: string | null
}

/** Phase 1 handoff — posted verbatim to POST /v1/copilot/actions/preview. */
export interface ActionIntent {
  operation: string
  arguments: Record<string, unknown>
}

export interface InsightAction {
  kind: InsightActionKind
  label: string
  route?: string | null
  scenario?: ScenarioPreset | null
  action?: ActionIntent | null
}

export interface RadarInsight {
  id: string
  insightType: InsightType
  status: InsightStatus
  severity: InsightSeverity
  category?: InsightCategory | null
  title: string
  summary: string
  entityType?: string | null
  entityId?: string | null
  entityName: string
  evidence: EvidenceItem[]
  impact: InsightImpact
  explanation: string[]
  actions: InsightAction[]
  source?: InsightSource | null
  dataQuality: DataAvailability
  freshness: DataFreshness
  detectorVersion: string
  generatedAt?: string | null
  updatedAt?: string | null
  seenAt?: string | null
  dismissedAt?: string | null
  resolvedAt?: string | null
}

export interface DomainCoverage {
  domain: string
  availability: DataAvailability
  detectors: string[]
  updatedAt?: string | null
  freshness: FreshnessStatus
  note: string
}

export interface RadarSummary {
  generatedAt: string
  neverScanned?: boolean
  activeCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  infoCount: number
  resolvedCount: number
  attentionCount: number
  opportunityCount: number
  coverage: DomainCoverage[]
  insights: RadarInsight[]
  radarVersion: string
}

export interface RadarInsightListResponse {
  items: RadarInsight[]
  total: number
  skip: number
  limit: number
}

export interface InsightListFilters {
  status?: InsightStatus[]
  severity?: InsightSeverity[]
  insightType?: InsightType[]
  category?: InsightCategory[]
  entityType?: string
  createdAfter?: string
  createdBefore?: string
  skip?: number
  limit?: number
}
