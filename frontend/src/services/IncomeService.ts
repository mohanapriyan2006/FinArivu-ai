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
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.get('/v1/income', config)
    const payload = response.data?.data
    const items = payload?.items ?? payload
    return Array.isArray(items) ? items : []
  },

  async create(data: IncomeInput, token: string | null): Promise<Income> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.post('/v1/income', data, config)
    return response.data?.data
  },

  async update(id: string, data: IncomeInput, token: string | null): Promise<Income> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.put(`/v1/income/${id}`, data, config)
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    await api.delete(`/v1/income/${id}`, config)
  },
}
