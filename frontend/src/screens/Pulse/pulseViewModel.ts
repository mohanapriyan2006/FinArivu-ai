import type {
  BudgetAnalysis,
  BudgetAnalysisItem,
} from '@/services/BudgetService'
import type { DashboardSummary } from '@/services/DashboardService'
import type { Expense } from '@/services/ExpenseService'
import type { FinancialProfile } from '@/types/financialProfile'
import { formatInr, formatInrNumber } from '@/utils/formatInr'
import { PROFILE_COMPLETION_THRESHOLD } from '@/utils/profileCompletion'
import type {
  PulseAttentionItem,
  PulseFinanceItem,
  PulseFinanceStatus,
  PulseGoalMini,
  PulseQuickAction,
  PulseRecentActivity,
  PulseState,
} from './types'

import {
  Receipt,
  PieChart,
  Wallet,
  TrendingUp,
  Target,
  Banknote,
  CreditCard,
  Shield,
  Calculator,
  AlertTriangle,
  Plus,
  Landmark,
  MoreHorizontal,
} from 'lucide-react-native'

export interface PulseViewModelInput {
  profile: FinancialProfile
  completionPercentage: number
  completionLastStep: string | null
  dashboard: DashboardSummary | null
  budget: BudgetAnalysis | null
  goals: Array<{
    id: string
    name: string
    current: number
    target: number
    targetYear: number
  }>
  expenses: Expense[]
}

const ICONS = {
  expense: Receipt,
  budget: PieChart,
  savings: Wallet,
  investment: TrendingUp,
  goal: Target,
  loan: Banknote,
  credit_card: CreditCard,
  insurance: Shield,
  tax: Calculator,
}

type ColorSemantic =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'secondary'
  | 'textSecondary'

type BackgroundSemantic =
  | 'primaryBackground'
  | 'successBackground'
  | 'accentBackground'
  | 'dangerBackground'
  | 'surface'

function colorForType(
  type: PulseFinanceItem['type']
): { color: ColorSemantic; background: BackgroundSemantic } {
  switch (type) {
    case 'expense':
      return { color: 'danger', background: 'dangerBackground' }
    case 'budget':
      return { color: 'warning', background: 'accentBackground' }
    case 'savings':
      return { color: 'success', background: 'successBackground' }
    case 'investment':
      return { color: 'primary', background: 'primaryBackground' }
    case 'goal':
      return { color: 'warning', background: 'accentBackground' }
    case 'loan':
      return { color: 'danger', background: 'dangerBackground' }
    case 'credit_card':
      return { color: 'secondary', background: 'primaryBackground' }
    case 'insurance':
      return { color: 'success', background: 'successBackground' }
    case 'tax':
      return { color: 'primary', background: 'primaryBackground' }
    default:
      return { color: 'primary', background: 'primaryBackground' }
  }
}

function safeAmount(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return ''
  return formatInr(value, { showSymbol: false })
}

function topCategoryExpense(expenses: Expense[]): {
  category: string
  amount: number
} | null {
  if (expenses.length === 0) return null
  const totals: Record<string, number> = {}
  for (const e of expenses) {
    const key = e.description ?? 'Other'
    totals[key] = (totals[key] ?? 0) + e.amount
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  return { category: sorted[0][0], amount: sorted[0][1] }
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const t = new Date()
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  )
}

function recentActivityLabel(iso: string): string {
  return isToday(iso) ? 'Today' : formatDateLabel(iso)
}

export function buildPulseState(input: PulseViewModelInput): PulseState {
  const { profile, completionPercentage, completionLastStep, dashboard, budget, goals, expenses } =
    input

  const finances: PulseFinanceItem[] = []

  // Expenses
  {
    const colors = colorForType('expense')
    const thisMonth = dashboard?.totalExpenses
    const top = topCategoryExpense(expenses)
    let subtitle = 'Track your spending'
    let value: string | undefined
    let status: PulseFinanceStatus = 'empty'
    if (typeof thisMonth === 'number' && thisMonth > 0) {
      value = `₹${formatInrNumber(thisMonth)} this month`
      status = 'normal'
      if (top) {
        subtitle = `${top.category} ₹${formatInrNumber(top.amount)}`
      }
    }
    finances.push({
      id: 'expenses',
      type: 'expense',
      title: 'Expenses',
      subtitle,
      value,
      status,
      icon: ICONS.expense,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'expenses',
      route: 'ExpenseTracker',
      addRoute: 'QuickAddExpense',
      emptyAction: 'Add expense',
    })
  }

  // Budget
  {
    const colors = colorForType('budget')
    const summary = budget?.summary
    let subtitle = 'Set your budget'
    let value: string | undefined
    let status: PulseFinanceStatus = 'empty'
    let progress: number | undefined
    if (summary && typeof summary.totalBudget === 'number' && summary.totalBudget > 0) {
      const used = summary.overallUsage ?? 0
      value = `${Math.round(used)}% used`
      subtitle = `₹${formatInrNumber(summary.totalSpent)} of ₹${formatInrNumber(summary.totalBudget)}`
      progress = used / 100
      status = used >= 100 ? 'attention' : used >= 80 ? 'warning' : 'normal'
    }
    finances.push({
      id: 'budget',
      type: 'budget',
      title: 'Budget',
      subtitle,
      value,
      progress,
      status,
      icon: ICONS.budget,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'expenses',
      emptyAction: 'Set budget',
    })
  }

  // Savings
  {
    const colors = colorForType('savings')
    const total = profile.savings?.totalSavings
    const emergency = profile.savings?.emergencyFund
    let subtitle = 'Add your savings'
    let value: string | undefined
    let status: PulseFinanceStatus = 'empty'
    let progress: number | undefined
    if (typeof total === 'number' && total >= 0) {
      value = formatInr(total)
      status = 'normal'
      if (typeof emergency === 'number' && emergency > 0) {
        subtitle = `Emergency fund ${formatInr(emergency)}`
        progress = Math.min(1, total > 0 ? emergency / total : 0)
      } else {
        subtitle = 'Set an emergency target'
      }
    }
    finances.push({
      id: 'savings',
      type: 'savings',
      title: 'Savings',
      subtitle,
      value,
      progress,
      status,
      icon: ICONS.savings,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'savings',
      emptyAction: 'Add savings',
    })
  }

  // Investments
  {
    const colors = colorForType('investment')
    const inv = profile.investments
    let subtitle = 'Add your investments'
    let value: string | undefined
    let status: PulseFinanceStatus = 'empty'
    if (inv?.hasInvestments === true) {
      const total = inv.totalInvestmentValue ?? 0
      value = formatInr(total)
      status = 'normal'
      const b = inv.breakdown
      if (b) {
        const parts: string[] = []
        if (b.mutualFunds) parts.push('MF')
        if (b.stocks) parts.push('Stocks')
        if (b.ppf) parts.push('PPF')
        subtitle = parts.slice(0, 3).join(' · ')
      }
    } else if (inv?.hasInvestments === false) {
      subtitle = 'No investments added'
      status = 'empty'
    }
    finances.push({
      id: 'investments',
      type: 'investment',
      title: 'Investments',
      subtitle,
      value,
      status,
      icon: ICONS.investment,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'investments',
      emptyAction: 'Add investment',
    })
  }

  // Goals
  {
    const colors = colorForType('goal')
    let subtitle = 'Set your first financial goal'
    let value: string | undefined
    let status: PulseFinanceStatus = 'empty'
    if (goals.length > 0) {
      const avg =
        goals.reduce((sum, g) => sum + (g.target > 0 ? g.current / g.target : 0), 0) /
        goals.length
      value = `${goals.length} active`
      subtitle = `${Math.round(avg * 100)}% average progress`
      status = 'normal'
    }
    finances.push({
      id: 'goals',
      type: 'goal',
      title: 'Goals',
      subtitle,
      value,
      status,
      icon: ICONS.goal,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'goals',
      addRoute: 'CreateGoal',
      emptyAction: 'Create goal',
    })
  }

  // Loans
  {
    const colors = colorForType('loan')
    const lp = profile.loans
    let subtitle = 'No loans added'
    let value: string | undefined
    let status: PulseFinanceStatus = 'empty'
    if (lp?.hasLoans === true && Array.isArray(lp.loans) && lp.loans.length > 0) {
      const totalEmi = lp.loans.reduce((sum, l) => sum + (l.monthlyEmi ?? 0), 0)
      const outstanding = lp.loans.reduce((sum, l) => sum + (l.outstandingAmount ?? 0), 0)
      value = `${lp.loans.length} active`
      subtitle = `EMI ${formatInr(totalEmi)} · Outstanding ${formatInr(outstanding)}`
      status = 'normal'
    } else if (lp?.hasLoans === false) {
      subtitle = 'No loans added'
    }
    finances.push({
      id: 'loans',
      type: 'loan',
      title: 'Loans & EMIs',
      subtitle,
      value,
      status,
      icon: ICONS.loan,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'loans',
      emptyAction: 'Add loan',
    })
  }

  // Credit Cards (only if configured)
  if (profile.creditCards) {
    const colors = colorForType('credit_card')
    const outstanding = profile.creditCards.totalOutstanding ?? 0
    const monthly = profile.creditCards.monthlySpending ?? profile.creditCards.typicalMonthlyPayment ?? 0
    const subtitle =
      monthly > 0 ? `Monthly spend ${formatInr(monthly)}` : 'View your cards'
    finances.push({
      id: 'credit_cards',
      type: 'credit_card',
      title: 'Credit Cards',
      subtitle,
      value: outstanding > 0 ? `Outstanding ${formatInr(outstanding)}` : undefined,
      status: outstanding > monthly && monthly > 0 ? 'warning' : 'normal',
      icon: ICONS.credit_card,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'creditCards',
      emptyAction: 'Add card',
    })
  }

  // Insurance (only if configured)
  if (profile.insurance && Array.isArray(profile.insurance.policies) && profile.insurance.policies.length > 0) {
    const colors = colorForType('insurance')
    const annual = profile.insurance.policies.reduce((sum, p) => sum + (p.annualPremium ?? 0), 0)
    finances.push({
      id: 'insurance',
      type: 'insurance',
      title: 'Insurance',
      subtitle: `${profile.insurance.policies.length} policies`,
      value: annual > 0 ? `Premium ${formatInr(annual)}` : undefined,
      status: 'normal',
      icon: ICONS.insurance,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'insurance',
      emptyAction: 'Add insurance',
    })
  }

  // Tax (only if configured)
  if (profile.taxDetails) {
    const colors = colorForType('tax')
    const income = profile.taxDetails.annualIncome
    const regime = profile.taxDetails.taxRegime
    const subtitle = regime ? `${regime} regime` : 'Review tax details'
    finances.push({
      id: 'tax',
      type: 'tax',
      title: 'Tax',
      subtitle,
      value: income > 0 ? `Income ${formatInr(income)}` : undefined,
      status: 'normal',
      icon: ICONS.tax,
      iconColor: colors.color,
      iconBackground: colors.background,
      routeStep: 'taxDetails',
      emptyAction: 'Add tax details',
    })
  }

  // Needs attention from budget
  const attention: PulseAttentionItem[] = []
  if (budget?.categories) {
    for (const cat of budget.categories) {
      const isOver =
        cat.status !== 'on_track' ||
        (typeof cat.usage === 'number' && cat.usage >= 100)
      if (!isOver) continue
      const severity: 'warning' | 'danger' =
        typeof cat.usage === 'number' && cat.usage >= 100 ? 'danger' : 'warning'
      attention.push({
        id: `budget-${cat.category}`,
        title: cat.category,
        message: cat.recommendation || `${cat.category} spending is above budget`,
        type: 'budget',
        routeStep: 'expenses',
        severity,
      })
    }
  }

  // Recent activity (expenses only; sorted newest first)
  const recent: PulseRecentActivity[] = []
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
  )
  for (const e of sorted.slice(0, 5)) {
    recent.push({
      id: e.id,
      title: 'Expense added',
      subtitle: e.description ?? 'Expense',
      amount: e.amount > 0 ? formatInr(e.amount) : undefined,
      dateLabel: recentActivityLabel(e.expenseDate),
      icon: Receipt,
      iconColor: 'danger',
      iconBackground: 'dangerBackground',
    })
  }

  const goalMinis: PulseGoalMini[] = goals.slice(0, 2).map((g) => ({
    id: g.id,
    name: g.name,
    current: g.current,
    target: g.target,
    progress: Math.min(1, g.target > 0 ? g.current / g.target : 0),
    targetYear: g.targetYear,
  }))

  const isNewUser =
    !profile.initialized &&
    finances.every((f) => f.status === 'empty') &&
    expenses.length === 0

  return {
    isNewUser,
    finances,
    attention,
    goals: goalMinis,
    recentActivity: recent,
    profileComplete: completionPercentage >= PROFILE_COMPLETION_THRESHOLD,
    profileCompletionPercentage: completionPercentage,
    lastIncompleteStep: (completionLastStep as PulseState['lastIncompleteStep']) ?? null,
  }
}

export const QUICK_ACTIONS: PulseQuickAction[] = [
  { id: 'add-expense', label: 'Expense', icon: Plus, route: 'QuickAddExpense' },
  { id: 'add-goal', label: 'Goal', icon: Target, route: 'CreateGoal' },
  { id: 'add-investment', label: 'Investment', icon: TrendingUp, route: 'AddInvestment' },
  { id: 'more', label: 'More', icon: MoreHorizontal, route: '__more__' },
]

export const MORE_ACTIONS: PulseQuickAction[] = [
  { id: 'more-expense', label: 'Expense', icon: Receipt, route: 'QuickAddExpense' },
  { id: 'more-goal', label: 'Goal', icon: Target, route: 'CreateGoal' },
  { id: 'more-investment', label: 'Investment', icon: TrendingUp, route: 'AddInvestment' },
  { id: 'more-loan', label: 'Loan', icon: Banknote, route: 'FinancialProfileSetup', params: { startStep: 'loans' } },
  { id: 'more-savings', label: 'Savings', icon: Wallet, route: 'FinancialProfileSetup', params: { startStep: 'savings' } },
  { id: 'more-fd', label: 'Fixed Deposit', icon: Landmark, route: 'FinancialProfileSetup', params: { startStep: 'fixedDeposits' } },
  { id: 'more-insurance', label: 'Insurance', icon: Shield, route: 'FinancialProfileSetup', params: { startStep: 'insurance' } },
  { id: 'more-credit-card', label: 'Credit Card', icon: CreditCard, route: 'FinancialProfileSetup', params: { startStep: 'creditCards' } },
]

export { AlertTriangle }
