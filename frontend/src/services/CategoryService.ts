import { api } from './api'

export interface Category {
  id: string
  name: string
  createdAt: string
}

export const CategoryService = {
  async list(token: string | null): Promise<Category[]> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.get('/v1/categories', config)
    const payload = response.data?.data
    const items = payload?.items ?? payload
    return Array.isArray(items) ? items : []
  },
}
