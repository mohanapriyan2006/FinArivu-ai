import { api } from './api'

export interface Expense {
  id: string
  userId: string
  categoryId: string
  amount: number
  description: string | null
  expenseDate: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseInput {
  categoryId: string
  amount: number
  description?: string
  expenseDate: string
}

export const ExpenseService = {
  async list(token: string | null): Promise<Expense[]> {
    const response = await api.get('/v1/expenses', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : []
  },

  async create(data: ExpenseInput, token: string | null): Promise<Expense> {
    const response = await api.post('/v1/expenses', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async update(id: string, data: ExpenseInput, token: string | null): Promise<Expense> {
    const response = await api.put(`/v1/expenses/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    await api.delete(`/v1/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
