import type {
  BudgetAnalysis,
  BudgetAnalysisItem,
} from '@/services/BudgetService'
import type { DashboardSummary } from '@/services/DashboardService'
import type { Expense } from '@/services/ExpenseService'
import type { Income } from '@/services/IncomeService'
import type { Goal } from '@/services/GoalService'
import type { FinancialProfile } from '@/types/financialProfile'
import { formatInr, formatInrNumber } from '@/utils/formatInr'
import type {
  AttentionItem,
  HealthFactor,
  InsightCategory,
  InsightsViewModel,
  PositiveItem,
  TopInsight,
  Trend,
  WeeklyMetric,
} from './types'

import {
  PiggyBank,
  Wallet,
  TrendingUp,
  Target,
  AlertTriangle,
  Banknote,
  CreditCard,
  Landmark,
  WalletMinimal,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native'

interface InsightGoal {
  id: string
  name: string
  current: number
  target: number
  targetYear: number
  monthlyContribution?: number
  type?: string
}

export interface InsightsViewModelInput {
  profile: FinancialProfile
  dashboard: DashboardSummary | null
  budget: BudgetAnalysis | null
  goals: InsightGoal[]
  expenses: Expense[]
  income: Income[]
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

type Status = 'strong' | 'fair' | 'weak' | 'unknown'

function statusScore(status: Status): number {
  switch (status) {
    case 'strong':
      return 20
    case 'fair':
      return 13
    case 'weak':
      return 6
    case 'unknown':
    default:
      return 0
  }
}

function getMonthlyIncome(input: InsightsViewModelInput): number {
  const fromProfile = input.profile.income?.monthlyTakeHome
  if (typeof fromProfile === 'number' && !isNaN(fromProfile) && fromProfile > 0) {
    return fromProfile
  }
  const fromDashboard = input.dashboard?.totalIncome
  if (typeof fromDashboard === 'number' && !isNaN(fromDashboard) && fromDashboard > 0) {
    return fromDashboard
  }
  const fromIncome = input.income.reduce((sum, i) => sum + (i.amount ?? 0), 0)
  if (fromIncome > 0) return fromIncome
  return 0
}

function getMonthlyExpenses(input: InsightsViewModelInput): number {
  const fromDashboard = input.dashboard?.totalExpenses
  if (typeof fromDashboard === 'number' && !isNaN(fromDashboard) && fromDashboard > 0) {
    return fromDashboard
  }
  const fromProfile = input.profile.expenses?.totalMonthlyExpenses
  if (typeof fromProfile === 'number' && !isNaN(fromProfile) && fromProfile > 0) {
    return fromProfile
  }
  return 0
}

function getTotalSavings(input: InsightsViewModelInput): number {
  return input.profile.savings?.totalSavings ?? 0
}

function getEmergencyFund(input: InsightsViewModelInput): number {
  return input.profile.savings?.emergencyFund ?? 0
}

function getTotalInvestments(input: InsightsViewModelInput): number {
  const inv = input.profile.investments
  if (!inv || inv.hasInvestments !== true) return 0
  return inv.totalInvestmentValue ?? 0
}

function getTotalLoans(input: InsightsViewModelInput): number {
  const lp = input.profile.loans
  if (!lp || lp.hasLoans !== true || !Array.isArray(lp.loans)) return 0
  return lp.loans.reduce((sum, l) => sum + (l.outstandingAmount ?? 0), 0)
}

function getTotalEmi(input: InsightsViewModelInput): number {
  const lp = input.profile.loans
  if (!lp || lp.hasLoans !== true || !Array.isArray(lp.loans)) return 0
  return lp.loans.reduce((sum, l) => sum + (l.monthlyEmi ?? 0), 0)
}

function getCreditCardOutstanding(input: InsightsViewModelInput): number {
  return input.profile.creditCards?.totalOutstanding ?? 0
}

function getCreditCardLimit(input: InsightsViewModelInput): number {
  return input.profile.creditCards?.totalCreditLimit ?? 0
}

function getCreditCardMonthlySpend(input: InsightsViewModelInput): number {
  return (
    input.profile.creditCards?.monthlySpending ??
    input.profile.creditCards?.typicalMonthlyPayment ??
    0
  )
}

function getTotalInsuranceCover(input: InsightsViewModelInput): number {
  const policies = input.profile.insurance?.policies
  if (!Array.isArray(policies) || policies.length === 0) return 0
  return policies.reduce((sum, p) => sum + (p.coverage ?? 0), 0)
}

function getFixedDeposits(input: InsightsViewModelInput): number {
  return input.profile.fixedDeposits?.totalValue ?? 0
}

function computeCashFlow(input: InsightsViewModelInput): { status: Status; ratio: number } {
  const income = getMonthlyIncome(input)
  const expenses = getMonthlyExpenses(input)
  if (income <= 0) return { status: 'unknown', ratio: 0 }
  const net = income - expenses
  const ratio = net / income
  if (ratio >= 0.3) return { status: 'strong', ratio }
  if (ratio >= 0.05) return { status: 'fair', ratio }
  return { status: 'weak', ratio }
}

function computeSavings(input: InsightsViewModelInput): { status: Status; months: number } {
  const emergency = getEmergencyFund(input)
  const monthlyExpenses = getMonthlyExpenses(input)
  if (emergency <= 0) {
    const totalSavings = getTotalSavings(input)
    if (totalSavings > 0) return { status: 'fair', months: 0 }
    return { status: 'unknown', months: 0 }
  }
  if (monthlyExpenses <= 0) return { status: 'fair', months: emergency > 0 ? 999 : 0 }
  const months = emergency / (monthlyExpenses / 2)
  if (months >= 6) return { status: 'strong', months }
  if (months >= 3) return { status: 'fair', months }
  return { status: 'weak', months }
}

function computeDebt(input: InsightsViewModelInput): { status: Status; dti: number } {
  const income = getMonthlyIncome(input)
  const emi = getTotalEmi(input)
  if (emi <= 0) {
    const loans = getTotalLoans(input)
    if (loans > 0) return { status: 'fair', dti: 0 }
    return { status: 'unknown', dti: 0 }
  }
  if (income <= 0) return { status: 'weak', dti: 1 }
  const dti = emi / income
  if (dti < 0.2) return { status: 'strong', dti }
  if (dti < 0.4) return { status: 'fair', dti }
  return { status: 'weak', dti }
}

function computeGoals(input: InsightsViewModelInput): { status: Status; progress: number } {
  const goals = input.goals
  if (goals.length === 0) return { status: 'unknown', progress: 0 }
  const avg =
    goals.reduce((sum, g) => sum + (g.target > 0 ? g.current / g.target : 0), 0) /
    goals.length
  if (avg >= 0.6) return { status: 'strong', progress: avg }
  if (avg >= 0.3) return { status: 'fair', progress: avg }
  return { status: 'weak', progress: avg }
}

function computeProtection(input: InsightsViewModelInput): { status: Status } {
  const hasInsurance = getTotalInsuranceCover(input) > 0
  const months = computeSavings(input).months
  if (hasInsurance && months >= 3) return { status: 'strong' }
  if (hasInsurance || months >= 3) return { status: 'fair' }
  if (input.profile.insurance || input.profile.savings) return { status: 'weak' }
  return { status: 'unknown' }
}

function computeHealthFactors(input: InsightsViewModelInput): HealthFactor[] {
  const cashFlow = computeCashFlow(input)
  const savings = computeSavings(input)
  const debt = computeDebt(input)
  const goals = computeGoals(input)
  const protection = computeProtection(input)

  return [
    { id: 'cash_flow', name: 'Cash Flow', status: cashFlow.status },
    { id: 'savings', name: 'Savings', status: savings.status },
    { id: 'debt', name: 'Debt', status: debt.status },
    { id: 'goals', name: 'Goals', status: goals.status },
    { id: 'protection', name: 'Protection', status: protection.status },
  ]
}

function healthStatusFromScore(score: number): string {
  if (score >= 75) return 'Healthy'
  if (score >= 50) return 'Stable'
  return 'Needs Attention'
}

function healthExplanation(
  factors: HealthFactor[]
): string {
  const strong = factors.filter((f) => f.status === 'strong').map((f) => f.name)
  const weak = factors.filter((f) => f.status === 'weak').map((f) => f.name)

  if (strong.length === 0 && weak.length === 0) {
    return 'Add a few financial details to see your health score.'
  }

  if (weak.length === 0) {
    return `Your ${strong.join(' and ')} are strong. Keep it up!`
  }

  if (strong.length === 0) {
    return `Your ${weak.join(' and ')} need attention.`
  }

  return `Your ${strong.join(' and ')} are strong, but ${weak.join(' and ')} need attention.`
}

function isThisWeek(dateString: string): boolean {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return false
  return d.getTime() >= Date.now() - WEEK_MS
}

function isLastWeek(dateString: string): boolean {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return false
  const t = d.getTime()
  return t < Date.now() - WEEK_MS && t >= Date.now() - 2 * WEEK_MS
}

function weeklyExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => isThisWeek(e.expenseDate))
    .reduce((sum, e) => sum + (e.amount ?? 0), 0)
}

function previousWeekExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => isLastWeek(e.expenseDate))
    .reduce((sum, e) => sum + (e.amount ?? 0), 0)
}

function topCategory(expenses: Expense[]): { category: string; amount: number } | null {
  if (expenses.length === 0) return null
  const totals: Record<string, number> = {}
  for (const e of expenses) {
    const key = e.description ?? 'Other'
    totals[key] = (totals[key] ?? 0) + (e.amount ?? 0)
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? { category: sorted[0][0], amount: sorted[0][1] } : null
}

function weeklyIncome(input: InsightsViewModelInput): number {
  const monthly = getMonthlyIncome(input)
  if (monthly > 0) return Math.round((monthly / 30) * 7)
  const fromIncome = input.income
    .filter((i) => new Date(i.incomeDate).getTime() >= Date.now() - WEEK_MS)
    .reduce((sum, i) => sum + (i.amount ?? 0), 0)
  return fromIncome
}

function buildWeeklySummary(input: InsightsViewModelInput): WeeklyMetric[] | null {
  const spent = weeklyExpenses(input.expenses)
  const income = weeklyIncome(input)
  const saved = income - spent
  const top = topCategory(input.expenses.filter((e) => isThisWeek(e.expenseDate)))

  if (spent <= 0 && income <= 0) return null

  const metrics: WeeklyMetric[] = [
    {
      id: 'spent',
      label: 'Spent',
      value: spent > 0 ? `₹${formatInrNumber(spent)}` : '₹0',
      icon: Wallet,
    },
  ]

  if (income > 0) {
    metrics.push({
      id: 'saved',
      label: 'Saved',
      value: saved >= 0 ? `+₹${formatInrNumber(saved)}` : `-₹${formatInrNumber(Math.abs(saved))}`,
      icon: PiggyBank,
    })
    metrics.push({
      id: 'net',
      label: 'Net',
      value: saved >= 0 ? `+₹${formatInrNumber(saved)}` : `-₹${formatInrNumber(Math.abs(saved))}`,
      icon: TrendingUp,
    })
  }

  if (top) {
    metrics.push({
      id: 'top_spend',
      label: 'Top Spend',
      value: `${top.category}`,
      icon: WalletMinimal,
    })
  }

  return metrics
}

function buildTrends(input: InsightsViewModelInput): Trend[] {
  const current = weeklyExpenses(input.expenses)
  const previous = previousWeekExpenses(input.expenses)

  const trends: Trend[] = []

  if (current > 0 || previous > 0) {
    const isPositive = current <= previous
    const delta =
      previous === 0
        ? current > 0
          ? 'new'
          : '0%'
        : `${Math.round(((current - previous) / previous) * 100)}%`
    trends.push({
      id: 'spending',
      label: 'Spending',
      from: `₹${formatInrNumber(previous)}`,
      to: `₹${formatInrNumber(current)}`,
      delta: isPositive ? `↓ ${delta}` : `↑ ${delta}`,
      isPositive,
    })
  }

  const monthlyIncome = getMonthlyIncome(input)
  const monthlyExpenses = getMonthlyExpenses(input)
  if (monthlyIncome > 0) {
    const savingsRate = Math.max(
      0,
      Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
    )
    trends.push({
      id: 'savings_rate',
      label: 'Savings Rate',
      from: '0%',
      to: `${savingsRate}%`,
      delta: savingsRate > 0 ? `↑ ${savingsRate} pts` : '—',
      isPositive: savingsRate > 0,
    })
  }

  const netWorth =
    getTotalSavings(input) +
    getTotalInvestments(input) +
    getFixedDeposits(input) -
    getTotalLoans(input) -
    getCreditCardOutstanding(input)
  if (netWorth !== 0) {
    trends.push({
      id: 'net_worth',
      label: 'Net Worth',
      from: '—',
      to: formatInr(netWorth, { showSymbol: true }),
      delta: netWorth > 0 ? '↑' : '↓',
      isPositive: netWorth > 0,
    })
  }

  return trends.slice(0, 3)
}

function buildBudgetAttention(input: InsightsViewModelInput): AttentionItem[] {
  const items: AttentionItem[] = []
  if (!input.budget?.categories) return items
  for (const cat of input.budget.categories) {
    const isOver =
      cat.status !== 'on_track' ||
      (typeof cat.usage === 'number' && cat.usage > 100)
    if (!isOver) continue
    const over = Math.max(0, (cat.spent ?? 0) - (cat.budget ?? 0))
    items.push({
      id: `budget-${cat.category}`,
      category: 'BUDGET',
      title: `${cat.category} is above budget`,
      explanation: `You spent ${formatInr(
        cat.spent ?? 0
      )} against a ${formatInr(cat.budget ?? 0)} target.${
        over > 0 ? ` That's ${formatInr(over)} over.` : ''
      }`,
      actionLabel: 'View budget',
      route: 'BudgetTracker',
    })
  }
  return items
}

function buildDebtAttention(input: InsightsViewModelInput): AttentionItem[] {
  const income = getMonthlyIncome(input)
  const emi = getTotalEmi(input)
  const outstanding = getTotalLoans(input)
  if (emi <= 0 && outstanding <= 0) return []

  const items: AttentionItem[] = []
  if (income > 0) {
    const dti = emi / income
    if (dti >= 0.4) {
      items.push({
        id: 'debt-high',
        category: 'DEBT',
        title: 'EMIs use a large share of income',
        explanation: `Your EMIs are ${formatInr(
          emi
        )}, which is ${Math.round(dti * 100)}% of your monthly take-home.`,
        actionLabel: 'View debt',
        route: 'LoanTracker',
      })
    }
  }

  const creditOutstanding = getCreditCardOutstanding(input)
  const creditMonthly = getCreditCardMonthlySpend(input)
  const limit = getCreditCardLimit(input)
  if (creditOutstanding > 0) {
    const utilization = limit > 0 ? creditOutstanding / limit : 0
    const message =
      limit > 0
        ? `You are using ${Math.round(utilization * 100)}% of your credit limit.`
        : `Your outstanding balance is ${formatInr(creditOutstanding)}.`
    if (creditOutstanding > creditMonthly || utilization > 0.5) {
      items.push({
        id: 'credit-card',
        category: 'CREDIT_CARD',
        title: 'Credit card balance is high',
        explanation: message,
        actionLabel: 'View cards',
        route: 'CreditCardTracker',
      })
    }
  }
  return items
}

function buildSavingsAttention(input: InsightsViewModelInput): AttentionItem[] {
  const months = computeSavings(input).months
  if (months >= 3 || months === 0) return []
  const emergency = getEmergencyFund(input)
  const monthlyExpenses = getMonthlyExpenses(input)
  const coveredMonths = monthlyExpenses > 0 ? emergency / (monthlyExpenses / 2) : 0
  return [
    {
      id: 'emergency-low',
      category: 'SAVINGS',
      title: 'Emergency fund is below target',
      explanation: `Your emergency fund covers about ${coveredMonths.toFixed(
        1
      )} months of essential expenses. Aim for at least 3 months.`,
      actionLabel: 'View savings',
      route: 'SavingsTracker',
    },
  ]
}

function buildGoalAttention(input: InsightsViewModelInput): AttentionItem[] {
  const items: AttentionItem[] = []
  const now = new Date().getFullYear()
  for (const g of input.goals) {
    if (g.target <= 0) continue
    const yearsLeft = Math.max(0, g.targetYear - now)
    const monthsLeft = yearsLeft * 12
    const monthly = g.monthlyContribution ?? 0
    const projected =
      g.current + (monthly > 0 ? monthly * monthsLeft : 0)
    const shortfall = g.target - projected
    if (shortfall > 0 && yearsLeft > 0) {
      const monthsBehind =
        monthly > 0 ? Math.ceil(shortfall / monthly) : Math.ceil(shortfall / Math.max(1, g.target / monthsLeft))
      items.push({
        id: `goal-${g.id}`,
        category: 'GOAL',
        title: `${g.name} is behind schedule`,
        explanation: `At your current pace, you're about ${monthsBehind} month${
          monthsBehind === 1 ? '' : 's'
        } behind target.`,
        actionLabel: 'View goal',
        route: 'GoalsTracker',
      })
    }
  }
  return items
}

function buildAttentionItems(input: InsightsViewModelInput): AttentionItem[] {
  const items: AttentionItem[] = [
    ...buildBudgetAttention(input),
    ...buildDebtAttention(input),
    ...buildSavingsAttention(input),
    ...buildGoalAttention(input),
  ]
  return items.slice(0, 3)
}

function buildPositiveItems(input: InsightsViewModelInput): PositiveItem[] {
  const items: PositiveItem[] = []
  const income = getMonthlyIncome(input)
  const expenses = getMonthlyExpenses(input)
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0

  if (savingsRate >= 30) {
    items.push({ id: 'savings-rate', title: `Savings rate is a healthy ${savingsRate}%` })
  }

  const months = computeSavings(input).months
  if (months >= 6) {
    items.push({ id: 'emergency-strong', title: 'Emergency fund covers 6+ months' })
  }

  const dti = computeDebt(input).dti
  if (dti > 0 && dti < 0.2) {
    items.push({ id: 'debt-low', title: 'EMIs are comfortably below 20% of income' })
  } else if (dti === 0) {
    const loans = getTotalLoans(input)
    if (loans > 0) items.push({ id: 'debt-clearing', title: 'Outstanding debt is being tracked' })
  }

  const goals = input.goals
  if (goals.length > 0) {
    const onTrack = goals.filter((g) => {
      if (g.target <= 0) return false
      const progress = g.current / g.target
      return progress >= 0.5
    }).length
    if (onTrack > 0) {
      items.push({ id: 'goals-on-track', title: `${onTrack} goal${onTrack === 1 ? '' : 's'} on track` })
    }
  }

  if (getTotalInvestments(input) > 0) {
    items.push({
      id: 'investments-tracked',
      title: `Investments worth ${formatInr(getTotalInvestments(input))} tracked`,
    })
  }

  return items.slice(0, 3)
}

function buildTopInsight(input: InsightsViewModelInput): TopInsight | null {
  const income = getMonthlyIncome(input)
  const expenses = getMonthlyExpenses(input)
  const net = income - expenses
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0

  // 1. Budget overage
  const overBudget = buildBudgetAttention(input)[0]
  if (overBudget) {
    return {
      category: 'BUDGET',
      title: overBudget.title,
      explanation: overBudget.explanation,
      actionLabel: overBudget.actionLabel,
      route: overBudget.route,
      params: overBudget.params,
    }
  }

  // 2. High debt / credit card
  const debt = buildDebtAttention(input)[0]
  if (debt) {
    return {
      category: debt.category,
      title: debt.title,
      explanation: debt.explanation,
      actionLabel: debt.actionLabel,
      route: debt.route,
      params: debt.params,
    }
  }

  // 3. Low emergency fund
  const emergency = buildSavingsAttention(input)[0]
  if (emergency) {
    return {
      category: 'SAVINGS',
      title: emergency.title,
      explanation: emergency.explanation,
      actionLabel: emergency.actionLabel,
      route: emergency.route,
      params: emergency.params,
    }
  }

  // 4. Goal behind
  const goal = buildGoalAttention(input)[0]
  if (goal) {
    return {
      category: 'GOAL',
      title: goal.title,
      explanation: goal.explanation,
      actionLabel: goal.actionLabel,
      route: goal.route,
      params: goal.params,
    }
  }

  // 5. Cash flow positive insight
  if (income > 0 && net > 0) {
    return {
      category: 'CASH_FLOW',
      title: `Monthly surplus is ${formatInr(net)}`,
      explanation: `Your income of ${formatInr(income)} covers expenses of ${formatInr(
        expenses
      )} with room to save or invest.`,
      metric: `Savings rate ${savingsRate}%`,
      actionLabel: 'View cash flow',
      route: 'ExpenseTracker',
    }
  }

  // 6. Top spend
  const top = topCategory(input.expenses)
  if (top) {
    return {
      category: 'SPENDING',
      title: `${top.category} is your top expense`,
      explanation: `You spent ${formatInr(top.amount)} on ${top.category} this period.`,
      actionLabel: 'View expenses',
      route: 'ExpenseTracker',
    }
  }

  // 7. Savings rate positive
  if (savingsRate > 0) {
    return {
      category: 'SAVINGS',
      title: `Savings rate is ${savingsRate}%`,
      explanation: `You're keeping ${savingsRate}% of your take-home income after expenses.`,
      actionLabel: 'View savings',
      route: 'SavingsTracker',
    }
  }

  // 8. Investment insight
  const investments = input.profile.investments
  if (investments?.hasInvestments) {
    const total = getTotalInvestments(input)
    const b = investments.breakdown
    const parts: string[] = []
    if (b) {
      if (b.mutualFunds) parts.push('mutual funds')
      if (b.stocks) parts.push('stocks')
      if (b.ppf) parts.push('PPF')
      if (b.nps) parts.push('NPS')
      if (b.gold) parts.push('gold')
    }
    if (parts.length === 1) {
      return {
        category: 'INVESTMENT',
        title: 'Investments are concentrated',
        explanation: `Most of your tracked investments are in ${parts[0]}. Consider reviewing allocation.`,
        actionLabel: 'View investments',
        route: 'InvestmentTracker',
      }
    }
    if (total > 0) {
      return {
        category: 'INVESTMENT',
        title: `Investments worth ${formatInr(total)}`,
        explanation: 'Your tracked investments are on the dashboard.',
        actionLabel: 'View investments',
        route: 'InvestmentTracker',
      }
    }
  }

  return null
}

function buildNetWorthInsight(input: InsightsViewModelInput): TopInsight | null {
  const netWorth =
    getTotalSavings(input) +
    getTotalInvestments(input) +
    getFixedDeposits(input) -
    getTotalLoans(input) -
    getCreditCardOutstanding(input)
  if (netWorth === 0) return null
  return {
    category: 'NET_WORTH',
    title: `Net worth is ${netWorth > 0 ? '' : '-'}${formatInr(Math.abs(netWorth))}`,
    explanation: 'Based on your tracked assets and liabilities.',
    actionLabel: 'View finances',
    route: 'SavingsTracker',
  }
}

function normalizeGoals(
  profile: FinancialProfile,
  serviceGoals: Goal[]
): InsightGoal[] {
  if (serviceGoals.length > 0) {
    return serviceGoals.map((g) => {
      const targetDate = new Date(g.targetDate)
      const targetYear = isNaN(targetDate.getTime())
        ? new Date().getFullYear()
        : targetDate.getFullYear()
      return {
        id: g.id,
        name: g.goalName,
        current: g.currentAmount ?? 0,
        target: g.targetAmount,
        targetYear,
      }
    })
  }
  if (profile.goals?.goals && profile.goals.goals.length > 0) {
    return profile.goals.goals.map((g) => ({
      id: g.id,
      name: g.name,
      current: g.currentSavedAmount ?? 0,
      target: g.targetAmount,
      targetYear: g.targetYear,
      monthlyContribution: g.monthlyContribution,
      type: g.type,
    }))
  }
  return []
}

export function buildInsightsState(input: InsightsViewModelInput): InsightsViewModel {
  const factors = computeHealthFactors(input)
  const counted = factors.filter((f) => f.status !== 'unknown')
  const healthScore =
    counted.length === 0
      ? null
      : Math.round(
          factors.reduce((sum, f) => sum + statusScore(f.status), 0) /
            factors.length
        )

  const healthStatus = healthScore !== null ? healthStatusFromScore(healthScore) : 'Unknown'

  const hasAnyData =
    input.profile.initialized ||
    !!input.dashboard ||
    input.expenses.length > 0 ||
    input.income.length > 0 ||
    input.goals.length > 0 ||
    !!input.budget

  const isNewUser =
    !input.profile.initialized &&
    !input.dashboard &&
    input.expenses.length === 0 &&
    input.income.length === 0 &&
    input.goals.length === 0 &&
    !input.budget

  if (!hasAnyData) {
    return {
      healthScore: null,
      healthStatus: '',
      healthFactors: [],
      healthExplanation: 'Add a few financial details to start seeing meaningful trends.',
      topInsight: null,
      weeklySummary: null,
      trends: [],
      attentionItems: [],
      positiveItems: [],
      isNewUser: true,
    }
  }

  return {
    healthScore,
    healthStatus,
    healthFactors: factors,
    healthExplanation: healthExplanation(factors),
    topInsight: buildTopInsight(input),
    weeklySummary: buildWeeklySummary(input),
    trends: buildTrends(input),
    attentionItems: buildAttentionItems(input),
    positiveItems: buildPositiveItems(input),
    isNewUser,
  }
}

export { normalizeGoals, buildNetWorthInsight }
