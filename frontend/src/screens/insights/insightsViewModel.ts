import {
  ArrowDownLeft,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react-native'

import type {
  AttentionItem,
  HealthFactor,
  HealthFactorStatus,
  InsightCategory,
  InsightsResponse,
  InsightsViewModel,
  MissingDataItem,
  PositiveItem,
  RawWeeklyMetric,
  TopInsight,
  Trend,
  WeeklyMetric,
} from './types'

const categoryMap: Record<string, InsightCategory> = {
  BUDGET: 'BUDGET',
  CASHFLOW: 'CASHFLOW',
  SAVINGS: 'SAVINGS',
  GOAL: 'GOAL',
  HEALTH: 'FINANCIAL_HEALTH',
  DEBT: 'DEBT',
  EMERGENCY: 'EMERGENCY',
  INVESTMENT: 'INVESTMENT',
  NET_WORTH: 'NET_WORTH',
  RETIREMENT: 'RETIREMENT',
  SPENDING: 'SPENDING',
}

const validRoutes = [
  'BudgetTracker',
  'ExpenseTracker',
  'GoalTracker',
  'SavingsTracker',
  'IncomeTracker',
  'InvestmentTracker',
  'LoanTracker',
  'CreditCardTracker',
  'FinancialHealth',
  'QuickAddExpense',
  'FinancialProfileSetup',
]

function coerceCategory(input: string | undefined): InsightCategory {
  if (!input) return 'FINANCIAL_HEALTH'
  const upper = input.toUpperCase()
  return categoryMap[upper] ?? 'FINANCIAL_HEALTH'
}

function coerceRoute(route: string | undefined | null): string {
  if (route && validRoutes.includes(route)) return route
  return 'FinancialHealth'
}

function coerceStatus(input: string | undefined): HealthFactorStatus {
  if (input === 'good' || input === 'strong') return 'strong'
  if (input === 'warning' || input === 'fair') return 'fair'
  if (input === 'danger' || input === 'weak') return 'weak'
  return 'unknown'
}

const weeklyIcons: Record<string, typeof Wallet> = {
  income: ArrowDownLeft,
  spent: Wallet,
  saved: PiggyBank,
  net: TrendingUp,
}

function mapTopInsight(insight: TopInsight | null): TopInsight | null {
  if (!insight) return null
  return {
    ...insight,
    category: coerceCategory(insight.category),
    route: coerceRoute(insight.route),
  }
}

function mapAttention(items: AttentionItem[]): AttentionItem[] {
  return items.map((item) => ({
    ...item,
    category: coerceCategory(item.category),
    route: coerceRoute(item.route),
  }))
}

function mapWeekly(items: RawWeeklyMetric[]): WeeklyMetric[] {
  return items.map((item) => ({
    ...item,
    icon: weeklyIcons[item.id] ?? Wallet,
  }))
}

function mapTrends(items: Trend[]): Trend[] {
  return items.map((item) => ({
    ...item,
    isPositive: item.isPositive,
  }))
}

function mapPositive(items: PositiveItem[]): PositiveItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
  }))
}

function mapMissing(items: MissingDataItem[]): MissingDataItem[] {
  return items.map((item) => ({
    ...item,
    route: coerceRoute(item.route),
  }))
}

export function buildInsightsState(data: InsightsResponse): InsightsViewModel {
  const hasData = data.hasData

  const health: { score: number; status: string; factors: HealthFactor[]; explanation: string } | null =
    hasData && data.health
      ? {
          score: data.health.score,
          status: data.health.status,
          factors: data.health.factors.map(
            (factor): HealthFactor => ({
              id: factor.id,
              name: factor.name,
              status: coerceStatus(factor.status),
            })
          ),
          explanation: data.health.explanation,
        }
      : null

  const healthScore = health?.score ?? null
  const healthStatus = health?.status ?? 'unknown'
  const healthFactors = health?.factors ?? []
  const healthExplanation =
    health?.explanation ??
    'Add a few financial details to start seeing your health score.'

  return {
    hasData,
    isNewUser: !hasData,
    healthScore,
    healthStatus,
    healthFactors,
    healthExplanation,
    topInsight: mapTopInsight(data.topInsight ?? null),
    weeklySummary: hasData ? mapWeekly(data.weekly ?? []) : null,
    trends: hasData ? mapTrends(data.trends ?? []) : [],
    attentionItems: hasData ? mapAttention(data.attention ?? []) : [],
    positiveItems: hasData ? mapPositive(data.positive ?? []) : [],
    missing: mapMissing(data.missing ?? []),
  }
}
