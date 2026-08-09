import { api } from './api'

export interface Asset {
  id: string
  userId: string
  assetType: string
  name: string
  value: number
  currency: string
  asOfDate?: string
  description?: string
  isEmergencyFund: boolean
  savingsBucket?: string
  interestRate?: number
  maturityDate?: string
  source: string
  createdAt: string
  updatedAt: string
}

export interface AssetInput {
  assetType: string
  name: string
  value: number
  currency?: string
  asOfDate?: string
  description?: string
  isEmergencyFund?: boolean
  savingsBucket?: string
  interestRate?: number
  maturityDate?: string
  source?: string
}

export const AssetService = {
  async list(token: string | null): Promise<Asset[]> {
    const response = await api.get('/v1/assets', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : []
  },

  async create(data: AssetInput, token: string | null): Promise<Asset> {
    const response = await api.post('/v1/assets', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async update(id: string, data: Partial<AssetInput>, token: string | null): Promise<Asset> {
    const response = await api.put(`/v1/assets/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    await api.delete(`/v1/assets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
