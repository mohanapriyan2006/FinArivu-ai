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
    return response.data || []
  },

  async create(data: BudgetInput, token: string | null): Promise<Budget> {
    const response = await api.post('/v1/budgets', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async update(id: string, data: BudgetInput, token: string | null): Promise<Budget> {
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
    const response = await api.get('/v1/budgets/analysis', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },
}
