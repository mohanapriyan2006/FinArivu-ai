import type { LucideIcon } from 'lucide-react-native'

export type InsightCategory =
  | 'CASH_FLOW'
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

export type HealthFactorStatus = 'strong' | 'fair' | 'weak' | 'unknown'

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
  from: string
  to: string
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

export interface InsightsViewModel {
  healthScore: number | null
  healthStatus: string
  healthFactors: HealthFactor[]
  healthExplanation: string
  topInsight: TopInsight | null
  weeklySummary: WeeklyMetric[] | null
  trends: Trend[]
  attentionItems: AttentionItem[]
  positiveItems: PositiveItem[]
  isNewUser: boolean
}

export interface UseInsightsResult {
  state: InsightsViewModel
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}
