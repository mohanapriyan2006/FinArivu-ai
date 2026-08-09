jest.mock('lucide-react-native', () => ({
  Receipt: 'Receipt',
  PieChart: 'PieChart',
  Wallet: 'Wallet',
  TrendingUp: 'TrendingUp',
  Target: 'Target',
  Banknote: 'Banknote',
  CreditCard: 'CreditCard',
  Shield: 'Shield',
  Calculator: 'Calculator',
  AlertTriangle: 'AlertTriangle',
  Plus: 'Plus',
  Landmark: 'Landmark',
  MoreHorizontal: 'MoreHorizontal',
}))

import { buildPulseState } from '@/screens/Pulse/pulseViewModel'
import type { BudgetAnalysis } from '@/services/BudgetService'
import type { DashboardSummary } from '@/services/DashboardService'
import type { Expense } from '@/services/ExpenseService'
import type { FinancialProfile } from '@/types/financialProfile'

describe('pulseViewModel', () => {
  const emptyProfile: FinancialProfile = { initialized: false }

  const populatedProfile: FinancialProfile = {
    initialized: true,
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
  }

  const dashboard: DashboardSummary = {
    totalIncome: 120000,
    totalExpenses: 42500,
    netCashFlow: 77500,
    recentIncome: [],
    recentExpenses: [
      { id: 'exp-1', description: 'Dining', amount: 1250, expenseDate: new Date().toISOString() },
    ],
    expenseBreakdown: [{ category: 'Food', amount: 8200 }],
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
      expenseDate: new Date(Date.now() - 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it('identifies a new user when no data exists', () => {
    const state = buildPulseState({
      profile: emptyProfile,
      completionPercentage: 0,
      completionLastStep: null,
      dashboard: null,
      budget: null,
      goals: [],
      expenses: [],
      assets: [],
      liabilities: [],
    })
    expect(state.isNewUser).toBe(true)
    expect(state.finances).toHaveLength(7)
    expect(state.attention).toHaveLength(0)
    expect(state.recentActivity).toHaveLength(0)
  })

  it('builds populated state with all core finance rows', () => {
    const assets = [
      { id: 'a1', userId: 'u1', assetType: 'Emergency Fund', name: 'Emergency', value: 150000, currency: 'INR', isEmergencyFund: true, source: 'manual', createdAt: '', updatedAt: '' },
      { id: 'a2', userId: 'u1', assetType: 'Bank', name: 'Savings', value: 100000, currency: 'INR', isEmergencyFund: false, source: 'manual', createdAt: '', updatedAt: '' },
      { id: 'a3', userId: 'u1', assetType: 'Mutual Fund', name: 'MF', value: 467500, currency: 'INR', isEmergencyFund: false, source: 'manual', createdAt: '', updatedAt: '' },
      { id: 'a4', userId: 'u1', assetType: 'Stock', name: 'Stocks', value: 212500, currency: 'INR', isEmergencyFund: false, source: 'manual', createdAt: '', updatedAt: '' },
      { id: 'a5', userId: 'u1', assetType: 'PPF', name: 'PPF', value: 102000, currency: 'INR', isEmergencyFund: false, source: 'manual', createdAt: '', updatedAt: '' },
      { id: 'a6', userId: 'u1', assetType: 'Other', name: 'Other', value: 68000, currency: 'INR', isEmergencyFund: false, source: 'manual', createdAt: '', updatedAt: '' },
    ]

    const liabilities = [
      { id: 'l1', userId: 'u1', liabilityType: 'Home Loan', name: 'Home', amount: 1840000, currency: 'INR', emi: 22000, source: 'manual', createdAt: '', updatedAt: '' },
      { id: 'l2', userId: 'u1', liabilityType: 'Personal Loan', name: 'Personal', amount: 120000, currency: 'INR', emi: 10000, source: 'manual', createdAt: '', updatedAt: '' },
    ]

    const state = buildPulseState({
      profile: populatedProfile,
      completionPercentage: 100,
      completionLastStep: 'completion',
      dashboard,
      budget,
      goals: populatedProfile.goals!.goals.map((g) => ({
        id: g.id,
        name: g.name,
        current: g.currentSavedAmount ?? 0,
        target: g.targetAmount,
        targetYear: g.targetYear,
      })),
      expenses,
      assets,
      liabilities,
    })

    expect(state.isNewUser).toBe(false)
    expect(state.finances.find((f) => f.id === 'expenses')?.value).toContain('42,500')
    expect(state.finances.find((f) => f.id === 'budget')?.value).toContain('85%')
    expect(state.finances.find((f) => f.id === 'savings')?.value).toContain('₹2,50,000')
    expect(state.finances.find((f) => f.id === 'investments')?.value).toContain('₹8,50,000')
    expect(state.finances.find((f) => f.id === 'loans')?.value).toContain('2 active')
  })

  it('creates attention items only when a budget category is over', () => {
    const state = buildPulseState({
      profile: populatedProfile,
      completionPercentage: 100,
      completionLastStep: 'completion',
      dashboard,
      budget,
      goals: [],
      expenses: [],
      assets: [],
      liabilities: [],
    })
    expect(state.attention).toHaveLength(1)
    expect(state.attention[0].title).toBe('Food')
    expect(state.attention[0].severity).toBe('danger')
  })

  it('does not create attention items when all categories are on track', () => {
    const onTrackBudget: BudgetAnalysis = {
      ...budget,
      categories: budget.categories.map((c) => ({ ...c, usage: 40, status: 'on_track' as const })),
      summary: { ...budget.summary, overallUsage: 40 },
    }
    const state = buildPulseState({
      profile: populatedProfile,
      completionPercentage: 100,
      completionLastStep: 'completion',
      dashboard,
      budget: onTrackBudget,
      goals: [],
      expenses: [],
      assets: [],
      liabilities: [],
    })
    expect(state.attention).toHaveLength(0)
  })

  it('caps recent activity at five items', () => {
    const many: Expense[] = Array.from({ length: 10 }, (_, i) => ({
      ...expenses[0],
      id: `exp-${i}`,
      amount: 100 + i,
      expenseDate: new Date(Date.now() - i * 86_400_000).toISOString(),
    }))
    const state = buildPulseState({
      profile: populatedProfile,
      completionPercentage: 100,
      completionLastStep: 'completion',
      dashboard,
      budget,
      goals: [],
      expenses: many,
      assets: [],
      liabilities: [],
    })
    expect(state.recentActivity).toHaveLength(5)
  })

  it('marks profile as complete when threshold is reached', () => {
    const state = buildPulseState({
      profile: emptyProfile,
      completionPercentage: 75,
      completionLastStep: 'savings',
      dashboard: null,
      budget: null,
      goals: [],
      expenses: [],
      assets: [],
      liabilities: [],
    })
    expect(state.profileComplete).toBe(true)
    expect(state.lastIncompleteStep).toBe('savings')
  })
})
