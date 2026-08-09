jest.mock('lucide-react-native', () => ({
  ArrowDownLeft: 'ArrowDownLeft',
  PiggyBank: 'PiggyBank',
  Wallet: 'Wallet',
  TrendingUp: 'TrendingUp',
  Plus: 'Plus',
}))

import { buildInsightsState } from '@/screens/insights/insightsViewModel'
import type { InsightsResponse } from '@/screens/insights/types'

const baseResponse: InsightsResponse = {
  hasData: true,
  health: {
    score: 72,
    status: 'good',
    factors: [
      { id: 'savings', name: 'Savings', status: 'good' },
      { id: 'emergency', name: 'Emergency', status: 'warning' },
      { id: 'debt', name: 'Debt', status: 'danger' },
      { id: 'goals', name: 'Goals', status: 'good' },
      { id: 'budget', name: 'Budget', status: 'good' },
    ],
    explanation: 'Your savings rate is healthy.',
  },
  topInsight: {
    category: 'SAVINGS',
    title: 'You saved ₹15,000',
    explanation: 'You saved 25% of income.',
    metric: '+₹15,000',
    actionLabel: 'View savings',
    route: 'SavingsTracker',
  },
  weekly: [
    { id: 'income', label: 'Income', value: '₹60,000' },
    { id: 'spent', label: 'Spent', value: '₹45,000' },
    { id: 'saved', label: 'Saved', value: '+₹15,000' },
    { id: 'net', label: 'Net', value: '+₹15,000' },
  ],
  trends: [
    {
      id: 'spending',
      label: 'Spending',
      fromValue: '₹50,000',
      toValue: '₹45,000',
      delta: '10%',
      isPositive: true,
    },
  ],
  attention: [
    {
      category: 'BUDGET',
      id: 'budget-food',
      title: 'Food is over budget',
      explanation: 'You spent more than planned.',
      actionLabel: 'View budget',
      route: 'BudgetTracker',
    },
  ],
  positive: [{ id: 'cashflow', title: 'Cash flow is positive' }],
  missing: [
    {
      id: 'investments',
      title: 'Add investments',
      explanation: 'Add investments to track net worth.',
      actionLabel: 'Add Investments',
      route: 'InvestmentTracker',
    },
  ],
}

describe('insightsViewModel', () => {
  it('maps a populated backend response into the view model', () => {
    const state = buildInsightsState(baseResponse)

    expect(state.hasData).toBe(true)
    expect(state.isNewUser).toBe(false)
    expect(state.healthScore).toBe(72)
    expect(state.healthStatus).toBe('good')
    expect(state.healthFactors).toHaveLength(5)
    expect(state.topInsight).not.toBeNull()
    expect(state.weeklySummary).toHaveLength(4)
    expect(state.trends).toHaveLength(1)
    expect(state.trends[0].fromValue).toBe('₹50,000')
    expect(state.attentionItems).toHaveLength(1)
    expect(state.positiveItems).toHaveLength(1)
    expect(state.missing).toHaveLength(1)
  })

  it('returns new user state when the backend reports no data', () => {
    const state = buildInsightsState({
      hasData: false,
      health: null,
      topInsight: null,
      weekly: [],
      trends: [],
      attention: [],
      positive: [],
      missing: [
        {
          id: 'income',
          title: 'Add income',
          explanation: 'Set up income.',
          actionLabel: 'Add Income',
          route: 'IncomeTracker',
        },
      ],
    })

    expect(state.isNewUser).toBe(true)
    expect(state.healthScore).toBeNull()
    expect(state.weeklySummary).toBeNull()
    expect(state.missing).toHaveLength(1)
  })

  it('coerces unknown categories and routes to safe defaults', () => {
    const response: InsightsResponse = {
      ...baseResponse,
      topInsight: {
        category: 'UNKNOWN' as any,
        title: 'Unknown',
        explanation: '...',
        route: 'UnknownRoute',
      },
    }

    const state = buildInsightsState(response)
    expect(state.topInsight?.category).toBe('FINANCIAL_HEALTH')
    expect(state.topInsight?.route).toBe('FinancialHealth')
  })

  it('maps weekly metric ids to icons', () => {
    const state = buildInsightsState(baseResponse)
    expect(state.weeklySummary?.[0].icon).toBe('ArrowDownLeft')
    expect(state.weeklySummary?.[1].icon).toBe('Wallet')
    expect(state.weeklySummary?.[2].icon).toBe('PiggyBank')
    expect(state.weeklySummary?.[3].icon).toBe('TrendingUp')
  })

  it('passes through missing data items', () => {
    const state = buildInsightsState(baseResponse)
    expect(state.missing[0].title).toBe('Add investments')
    expect(state.missing[0].route).toBe('InvestmentTracker')
  })
})
