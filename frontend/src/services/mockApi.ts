import type { AxiosRequestConfig } from 'axios'

// Set EXPO_PUBLIC_DISABLE_AUTH=true (or 1) to skip login and use the mock backend.
const envValue = process.env.EXPO_PUBLIC_DISABLE_AUTH
export const DISABLE_AUTH = envValue?.toLowerCase() === 'true' || envValue === '1'
export const MOCK_BACKEND = DISABLE_AUTH

const now = new Date().toISOString()
const today = now.split('T')[0]

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getMockResponse(config: AxiosRequestConfig) {
  const method = (config.method || 'GET').toLowerCase()
  const url = (config.url || '').replace(/^\/?/, '/')
  const payload =
    typeof config.data === 'string' && config.data
      ? JSON.parse(config.data)
      : config.data

  const authResponse = {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    user: {
      id: 'mock-user',
      email: payload?.email || 'user@example.com',
      created_at: now,
      updated_at: now,
    },
  }

  if (url === '/v1/auth/login' || url === '/v1/auth/register') {
    return { data: authResponse }
  }

  if (url === '/v1/categories' && method === 'get') {
    return {
      data: [
        { id: 'cat-1', name: 'Housing', createdAt: now },
        { id: 'cat-2', name: 'Food', createdAt: now },
        { id: 'cat-3', name: 'Transport', createdAt: now },
      ],
    }
  }

  if (url === '/v1/budgets' && method === 'get') {
    return [
      {
        id: 'budget-1',
        userId: 'mock-user',
        categoryId: 'cat-1',
        monthlyLimit: 5000,
        categoryName: 'Housing',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'budget-2',
        userId: 'mock-user',
        categoryId: 'cat-2',
        monthlyLimit: 3000,
        categoryName: 'Food',
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  if (url === '/v1/budgets/analysis' && method === 'get') {
    return {
      data: {
        categories: [
          {
            category: 'Housing',
            budget: 5000,
            spent: 2500,
            remaining: 2500,
            usage: 50,
            status: 'on_track',
            recommendation: 'You are on track with housing expenses.',
          },
          {
            category: 'Food',
            budget: 3000,
            spent: 1200,
            remaining: 1800,
            usage: 40,
            status: 'on_track',
            recommendation: 'Great, food spending is under control.',
          },
        ],
        summary: {
          totalBudget: 8000,
          totalSpent: 3700,
          totalRemaining: 4300,
          overallUsage: 46.25,
        },
      },
    }
  }

  if (url.startsWith('/v1/budgets/') && method === 'delete') {
    return {}
  }

  if (url === '/v1/expenses' && method === 'get') {
    return [
      {
        id: 'exp-1',
        userId: 'mock-user',
        categoryId: 'cat-2',
        amount: 250,
        description: 'Groceries',
        expenseDate: today,
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  if (url.startsWith('/v1/expenses/') && method === 'delete') {
    return {}
  }

  if (url === '/v1/goals' && method === 'get') {
    return [
      {
        id: 'goal-1',
        userId: 'mock-user',
        goalName: 'Emergency Fund',
        goalType: 'savings',
        targetAmount: 100000,
        currentAmount: 25000,
        targetDate: '2026-12-31',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  if (url === '/v1/goals/summary' && method === 'get') {
    return {
      data: {
        totalGoals: 1,
        completedGoals: 0,
        averageProgress: 25,
        upcomingDeadlines: [],
      },
    }
  }

  if (url.startsWith('/v1/goals/') && method === 'delete') {
    return {}
  }

  if (url === '/v1/income' && method === 'get') {
    return [
      {
        id: 'inc-1',
        userId: 'mock-user',
        source: 'Salary',
        amount: 50000,
        incomeDate: today,
        notes: null,
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  if (url.startsWith('/v1/income/') && method === 'delete') {
    return {}
  }

  if (url === '/v1/insights' && method === 'get') {
    return [
      {
        id: 'insight-1',
        userId: 'mock-user',
        category: 'savings',
        title: 'Great savings rate',
        description: 'You are saving 25% of your income.',
        priority: 'high',
        action: 'Keep it up',
        isRead: false,
        createdAt: now,
      },
    ]
  }

  if (url === '/v1/insights/unread' && method === 'get') {
    return { data: [] }
  }

  if (url.startsWith('/v1/insights/') && method === 'patch') {
    return {
      data: {
        id: 'insight-1',
        userId: 'mock-user',
        category: 'savings',
        title: 'Great savings rate',
        description: 'You are saving 25% of your income.',
        priority: 'high',
        action: 'Keep it up',
        isRead: true,
        createdAt: now,
      },
    }
  }

  if (url === '/v1/insights/mark-all-read' && method === 'post') {
    return { data: { markedRead: 1 } }
  }

  const profile = {
    id: 'profile-1',
    userId: 'mock-user',
    fullName: payload?.fullName || 'Test User',
    age: payload?.age ?? 30,
    city: payload?.city || 'Mumbai',
    occupation: payload?.occupation || 'Engineer',
    monthlyIncome: payload?.monthlyIncome ?? 100000,
    retirementAge: payload?.retirementAge ?? 60,
    createdAt: now,
    updatedAt: now,
  }

  if (url === '/v1/profile' && method === 'get') {
    return { data: profile }
  }

  if (url === '/v1/profile' && (method === 'post' || method === 'put')) {
    return { data: profile }
  }

  if (url === '/v1/dashboard' && method === 'get') {
    return {
      data: {
        totalIncome: 50000,
        totalExpenses: 3700,
        netCashFlow: 46300,
        netWorth: 1428950,
        totalAssets: 1697700,
        totalLiabilities: 268750,
        recentIncome: [
          { id: 'inc-1', source: 'Salary', amount: 50000, incomeDate: today },
        ],
        recentExpenses: [
          { id: 'exp-1', description: 'Groceries', amount: 250, expenseDate: today },
        ],
        expenseBreakdown: [{ category: 'Food', amount: 250 }],
        cards: [
          {
            id: 'checking',
            title: 'Checking',
            label: 'Assets',
            value: 45200,
            count: 1,
            hasData: true,
            route: 'SavingsTracker',
          },
          {
            id: 'investments',
            title: 'Investments',
            label: 'Assets',
            value: 124500,
            count: 1,
            hasData: true,
            route: 'InvestmentTracker',
          },
          {
            id: 'credit_cards',
            title: 'Credit Cards',
            label: 'Liabilities',
            value: 4250,
            count: 1,
            hasData: true,
            route: 'CreditCardTracker',
          },
          {
            id: 'loan',
            title: 'Loan',
            label: 'Liabilities',
            value: 485000,
            count: 1,
            hasData: true,
            route: 'LoanTracker',
          },
        ],
      },
    }
  }

  if (url === '/v1/users/sync' && method === 'post') {
    return { data: profile }
  }

  if (url === '/v1/chat' && method === 'post') {
    const userMessage = payload?.message || ''
    return {
      data: {
        message: `This is a mock CFO reply. You asked: "${userMessage}". Try disabling MOCK_BACKEND to use the real AI backend.`,
        guardrail_triggered: false,
        disclaimer: '',
      },
    }
  }

  // Generic fallback for create/update endpoints.
  if (method === 'post' || method === 'put') {
    return { data: { id: generateId(), ...payload, createdAt: now, updatedAt: now } }
  }

  return { data: [] }
}
