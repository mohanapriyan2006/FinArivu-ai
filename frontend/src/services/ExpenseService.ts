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
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.get('/v1/expenses', config)
    const payload = response.data?.data
    const items = payload?.items ?? payload
    return Array.isArray(items) ? items : []
  },

  async create(data: ExpenseInput, token: string | null): Promise<Expense> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.post('/v1/expenses', data, config)
    return response.data?.data
  },

  async update(id: string, data: Partial<ExpenseInput>, token: string | null): Promise<Expense> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.put(`/v1/expenses/${id}`, data, config)
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    await api.delete(`/v1/expenses/${id}`, config)
  },
}
