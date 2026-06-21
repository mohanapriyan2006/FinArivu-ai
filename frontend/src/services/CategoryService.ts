import { api } from './api'

export interface Category {
  id: string
  name: string
  createdAt: string
}

export const CategoryService = {
  async list(token: string | null): Promise<Category[]> {
    const response = await api.get('/v1/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data || []
  },
}
