import { api } from './api'

export interface Income {
  id: string
  userId: string
  source: string
  amount: number
  incomeDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface IncomeInput {
  source: string
  amount: number
  incomeDate: string
  notes?: string
}

export const IncomeService = {
  async list(token: string | null): Promise<Income[]> {
    const response = await api.get('/v1/income', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : []
  },

  async create(data: IncomeInput, token: string | null): Promise<Income> {
    const response = await api.post('/v1/income', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async update(id: string, data: IncomeInput, token: string | null): Promise<Income> {
    const response = await api.put(`/v1/income/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    await api.delete(`/v1/income/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
