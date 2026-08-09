import { api } from './api'

export interface Budget {
  id: string
  userId: string
  categoryId: string
  monthlyLimit: number
  categoryName: string | null
  createdAt: string
  updatedAt: string
}

export interface BudgetInput {
  categoryId: string
  monthlyLimit: number
}

export interface BudgetAnalysisItem {
  category: string
  budget: number
  spent: number
  remaining: number
  usage: number
  status: string
  recommendation: string
}

export interface BudgetAnalysis {
  categories: BudgetAnalysisItem[]
  summary: {
    totalBudget: number
    totalSpent: number
    totalRemaining: number
    overallUsage: number
  }
}

export const BudgetService = {
  async list(token: string | null): Promise<Budget[]> {
    const response = await api.get('/v1/budgets', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : []
  },

  async create(data: BudgetInput, token: string | null): Promise<Budget> {
    const response = await api.post('/v1/budgets', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async update(id: string, data: Partial<BudgetInput>, token: string | null): Promise<Budget> {
    const response = await api.put(`/v1/budgets/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    await api.delete(`/v1/budgets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  async getAnalysis(token: string | null): Promise<BudgetAnalysis> {
    const response = await api.get('/v1/financial/budget-analysis', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = response.data?.data
    const firstRecommendation = Array.isArray(data.recommendations) ? data.recommendations[0] : ''
    return {
      categories: (data.categories || []).map((c: any) => {
        const budget = Number(c.budget ?? 0)
        const spent = Number(c.spent ?? 0)
        return {
          category: c.categoryName,
          budget,
          spent,
          remaining: budget - spent,
          usage: Number(c.usage ?? 0),
          status: c.status,
          recommendation: firstRecommendation,
        }
      }),
      summary: {
        totalBudget: Number(data.totalBudget ?? 0),
        totalSpent: Number(data.totalSpent ?? 0),
        totalRemaining: Number(data.remainingBudget ?? 0),
        overallUsage: Number(data.overallUtilization ?? 0),
      },
    }
  },
}
