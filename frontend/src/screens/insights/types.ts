import type { LucideIcon } from 'lucide-react-native'

export type InsightCategory =
  | 'CASHFLOW'
  | 'SPENDING'
  | 'SAVINGS'
  | 'BUDGET'
  | 'GOAL'
  | 'DEBT'
  | 'CREDIT_CARD'
  | 'NET_WORTH'
  | 'INVESTMENT'
  | 'RETIREMENT'
  | 'FINANCIAL_HEALTH'
  | 'EMERGENCY'
  | 'HEALTH'

export type HealthFactorStatus = 'strong' | 'fair' | 'weak' | 'unknown' | 'good' | 'warning' | 'danger'

export interface HealthFactor {
  id: string
  name: string
  status: HealthFactorStatus
}

export interface TopInsight {
  category: InsightCategory
  title: string
  explanation: string
  metric?: string
  actionLabel?: string
  route: string
  params?: Record<string, unknown>
}

export interface WeeklyMetric {
  id: string
  label: string
  value: string
  icon: LucideIcon
}

export interface Trend {
  id: string
  label: string
  fromValue: string
  toValue: string
  delta: string
  isPositive: boolean
}

export interface AttentionItem {
  id: string
  category: InsightCategory
  title: string
  explanation: string
  actionLabel?: string
  route: string
  params?: Record<string, unknown>
}

export interface PositiveItem {
  id: string
  title: string
}

export interface MissingDataItem {
  id: string
  title: string
  explanation: string
  actionLabel: string
  route: string
}

export interface RawWeeklyMetric {
  id: string
  label: string
  value: string
}

// Backend `GET /v1/insights` response (camelCase because the Pydantic schemas use alias generator).
export interface InsightsResponse {
  hasData: boolean
  health: {
    score: number
    status: string
    factors: HealthFactor[]
    explanation: string
  } | null
  topInsight: TopInsight | null
  weekly: RawWeeklyMetric[]
  trends: Trend[]
  attention: AttentionItem[]
  positive: PositiveItem[]
  missing: MissingDataItem[]
}

export interface InsightsViewModel {
  hasData: boolean
  healthScore: number | null
  healthStatus: string
  healthFactors: HealthFactor[]
  healthExplanation: string
  topInsight: TopInsight | null
  weeklySummary: WeeklyMetric[] | null
  trends: Trend[]
  attentionItems: AttentionItem[]
  positiveItems: PositiveItem[]
  missing: MissingDataItem[]
  isNewUser: boolean
}

export interface UseInsightsResult {
  state: InsightsViewModel
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}
