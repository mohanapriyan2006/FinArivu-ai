import { api } from './api'

export interface Insight {
  id: string
  userId: string
  category: string
  title: string
  description: string
  priority: string
  action: string
  isRead: boolean
  createdAt: string
}

export const InsightService = {
  async list(token: string | null): Promise<Insight[]> {
    const response = await api.get('/v1/insights', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : []
  },

  async getUnread(token: string | null): Promise<Insight[]> {
    const response = await api.get('/v1/insights/unread', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data || []
  },

  async markRead(id: string, token: string | null): Promise<Insight> {
    const response = await api.patch(`/v1/insights/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async markAllRead(token: string | null): Promise<{ markedRead: number }> {
    const response = await api.post('/v1/insights/mark-all-read', {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },
}
