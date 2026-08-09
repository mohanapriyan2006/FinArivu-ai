jest.mock('lucide-react-native', () => ({
  PiggyBank: 'PiggyBank',
  Wallet: 'Wallet',
  TrendingUp: 'TrendingUp',
  Target: 'Target',
  AlertTriangle: 'AlertTriangle',
  Banknote: 'Banknote',
  CreditCard: 'CreditCard',
  Landmark: 'Landmark',
  WalletMinimal: 'WalletMinimal',
  ArrowUpRight: 'ArrowUpRight',
  ArrowDownRight: 'ArrowDownRight',
}))

import { buildInsightsState } from '@/screens/insights/insightsViewModel'
import type { BudgetAnalysis } from '@/services/BudgetService'
import type { DashboardSummary } from '@/services/DashboardService'
import type { Expense } from '@/services/ExpenseService'
import type { Income } from '@/services/IncomeService'
import type { FinancialProfile } from '@/types/financialProfile'

describe('insightsViewModel', () => {
  const emptyProfile: FinancialProfile = { initialized: false }

  const populatedProfile: FinancialProfile = {
    initialized: true,
    income: {
      monthlyTakeHome: 100000,
      isAnnual: false,
    },
    expenses: {
      totalMonthlyExpenses: 3700,
      breakdown: {
        food: 2000,
        transport: 1200,
        other: 500,
      },
    },
    savings: {
      totalSavings: 250000,
      emergencyFund: 150000,
      generalSavings: 100000,
      goalSavings: 0,
    },
    investments: {
      hasInvestments: true,
      totalInvestmentValue: 850000,
      breakdown: {
        mutualFunds: 467500,
        stocks: 212500,
        ppf: 102000,
        other: 68000,
      },
    },
    loans: {
      hasLoans: true,
      loans: [
        {
          id: 'loan-1',
          type: 'home',
          outstandingAmount: 1840000,
          monthlyEmi: 22000,
          interestRate: 8.5,
          remainingTenure: 180,
        },
        {
          id: 'loan-2',
          type: 'personal',
          outstandingAmount: 120000,
          monthlyEmi: 10000,
          interestRate: 12,
          remainingTenure: 12,
        },
      ],
    },
    goals: {
      goals: [
        {
          id: 'goal-1',
          type: 'home',
          name: 'House',
          targetAmount: 5000000,
          targetYear: 2032,
          currentSavedAmount: 1800000,
          monthlyContribution: 20000,
        },
      ],
    },
    fixedDeposits: {
      totalValue: 100000,
      fds: [],
    },
  }

  const dashboard: DashboardSummary = {
    totalIncome: 100000,
    totalExpenses: 3700,
    netCashFlow: 96300,
    recentIncome: [],
    recentExpenses: [],
    expenseBreakdown: [{ category: 'Food', amount: 3700 }],
  }

  const budget: BudgetAnalysis = {
    categories: [
      {
        category: 'Housing',
        budget: 15000,
        spent: 12000,
        remaining: 3000,
        usage: 80,
        status: 'on_track',
        recommendation: 'You are on track with housing.',
      },
      {
        category: 'Food',
        budget: 10000,
        spent: 12000,
        remaining: -2000,
        usage: 120,
        status: 'over_budget',
        recommendation: 'Food spending is above budget.',
      },
    ],
    summary: {
      totalBudget: 50000,
      totalSpent: 42500,
      totalRemaining: 7500,
      overallUsage: 85,
    },
  }

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      userId: 'u1',
      categoryId: 'cat-1',
      amount: 1250,
      description: 'Dining',
      expenseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      userId: 'u1',
      categoryId: 'cat-2',
      amount: 8200,
      description: 'Groceries',
      expenseDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  const income: Income[] = [
    {
      id: 'inc-1',
      userId: 'u1',
      source: 'Salary',
      amount: 100000,
      incomeDate: new Date().toISOString(),
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it('identifies a new user when no data exists', () => {
    const state = buildInsightsState({
      profile: emptyProfile,
      dashboard: null,
      budget: null,
      goals: [],
      expenses: [],
      income: [],
    })
    expect(state.isNewUser).toBe(true)
    expect(state.healthScore).toBeNull()
    expect(state.topInsight).toBeNull()
    expect(state.weeklySummary).toBeNull()
    expect(state.attentionItems).toHaveLength(0)
    expect(state.positiveItems).toHaveLength(0)
  })

  it('builds a populated state with health score and top insight', () => {
    const state = buildInsightsState({
      profile: populatedProfile,
      dashboard,
      budget,
      goals: populatedProfile.goals!.goals.map((g) => ({
        id: g.id,
        name: g.name,
        current: g.currentSavedAmount ?? 0,
        target: g.targetAmount,
        targetYear: g.targetYear,
        monthlyContribution: g.monthlyContribution,
      })),
      expenses,
      income,
    })

    expect(state.isNewUser).toBe(false)
    expect(typeof state.healthScore).toBe('number')
    expect(state.healthFactors).toHaveLength(5)
    expect(state.weeklySummary).not.toBeNull()
    expect(state.weeklySummary!.length).toBeGreaterThanOrEqual(3)
    expect(state.topInsight).not.toBeNull()
  })

  it('prioritizes budget overage as the top insight when a category is over budget', () => {
    const state = buildInsightsState({
      profile: populatedProfile,
      dashboard,
      budget,
      goals: [],
      expenses,
      income,
    })
    expect(state.topInsight?.title).toContain('above budget')
  })

  it('creates attention items for over-budget categories and behind-schedule goals', () => {
    const state = buildInsightsState({
      profile: populatedProfile,
      dashboard,
      budget,
      goals: populatedProfile.goals!.goals.map((g) => ({
        id: g.id,
        name: g.name,
        current: g.currentSavedAmount ?? 0,
        target: g.targetAmount,
        targetYear: g.targetYear,
        monthlyContribution: g.monthlyContribution,
      })),
      expenses,
      income,
    })
    expect(state.attentionItems.length).toBeGreaterThanOrEqual(1)
    expect(state.attentionItems.some((a) => a.category === 'BUDGET')).toBe(true)
  })

  it('does not create attention items when budget is on track and goals are on track', () => {
    const onTrackBudget: BudgetAnalysis = {
      ...budget,
      categories: budget.categories.map((c) => ({
        ...c,
        spent: c.budget,
        remaining: 0,
        usage: 100,
        status: 'on_track' as const,
      })),
      summary: { ...budget.summary, overallUsage: 100 },
    }
    const onTrackGoal = {
      ...populatedProfile.goals!.goals[0],
      targetAmount: 100000,
      currentSavedAmount: 90000,
      monthlyContribution: 5000,
    }
    const state = buildInsightsState({
      profile: {
        ...populatedProfile,
        goals: { goals: [onTrackGoal] },
        loans: { hasLoans: false, loans: [] },
      },
      dashboard,
      budget: onTrackBudget,
      goals: [{
        id: onTrackGoal.id,
        name: onTrackGoal.name,
        current: onTrackGoal.currentSavedAmount,
        target: onTrackGoal.targetAmount,
        targetYear: onTrackGoal.targetYear,
        monthlyContribution: onTrackGoal.monthlyContribution,
      }],
      expenses,
      income,
    })
    expect(state.attentionItems).toHaveLength(0)
    expect(state.positiveItems.length).toBeGreaterThanOrEqual(1)
  })

  it('exposes positive items for healthy savings and investments', () => {
    const state = buildInsightsState({
      profile: populatedProfile,
      dashboard,
      budget: {
        ...budget,
        categories: budget.categories.map((c) => ({
          ...c,
          usage: 50,
          status: 'on_track' as const,
        })),
        summary: { ...budget.summary, overallUsage: 50 },
      },
      goals: populatedProfile.goals!.goals.map((g) => ({
        id: g.id,
        name: g.name,
        current: g.currentSavedAmount ?? 0,
        target: g.targetAmount,
        targetYear: g.targetYear,
        monthlyContribution: g.monthlyContribution,
      })),
      expenses,
      income,
    })
    expect(state.positiveItems.length).toBeGreaterThanOrEqual(1)
    expect(state.positiveItems.some((p) => p.title.includes('Savings'))).toBe(true)
  })

  it('does not fabricate net worth or investment values when data is missing', () => {
    const state = buildInsightsState({
      profile: { ...emptyProfile, initialized: true },
      dashboard: null,
      budget: null,
      goals: [],
      expenses: [],
      income: [],
    })
    expect(state.weeklySummary).toBeNull()
    expect(state.trends).toHaveLength(0)
    expect(state.topInsight).toBeNull()
  })
})
