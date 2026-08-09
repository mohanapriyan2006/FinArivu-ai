import { api } from './api'

export interface Liability {
  id: string
  userId: string
  liabilityType: string
  name: string
  amount: number
  currency: string
  interestRate?: number
  emi?: number
  remainingTenureMonths?: number
  startDate?: string
  endDate?: string
  description?: string
  creditLimit?: number
  monthlySpend?: number
  source: string
  createdAt: string
  updatedAt: string
}

export interface LiabilityInput {
  liabilityType: string
  name: string
  amount: number
  currency?: string
  interestRate?: number
  emi?: number
  remainingTenureMonths?: number
  startDate?: string
  endDate?: string
  description?: string
  creditLimit?: number
  monthlySpend?: number
  source?: string
}

export const LiabilityService = {
  async list(token: string | null): Promise<Liability[]> {
    const response = await api.get('/v1/liabilities', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : []
  },

  async create(data: LiabilityInput, token: string | null): Promise<Liability> {
    const response = await api.post('/v1/liabilities', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async update(id: string, data: Partial<LiabilityInput>, token: string | null): Promise<Liability> {
    const response = await api.put(`/v1/liabilities/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    await api.delete(`/v1/liabilities/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
