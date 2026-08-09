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
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.get('/v1/assets', config)
    const payload = response.data?.data
    const items = payload?.items ?? payload
    return Array.isArray(items) ? items : []
  },

  async create(data: AssetInput, token: string | null): Promise<Asset> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.post('/v1/assets', data, config)
    return response.data?.data
  },

  async update(id: string, data: Partial<AssetInput>, token: string | null): Promise<Asset> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.put(`/v1/assets/${id}`, data, config)
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    await api.delete(`/v1/assets/${id}`, config)
  },
}
