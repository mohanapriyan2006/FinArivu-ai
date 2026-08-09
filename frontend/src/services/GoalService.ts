import { api } from './api'

export interface Goal {
  id: string
  userId: string
  goalName: string
  goalType: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface GoalInput {
  goalName: string
  goalType: string
  targetAmount: number
  currentAmount?: number
  targetDate: string
  status?: string
}

export interface GoalSummary {
  totalGoals: number
  completedGoals: number
  averageProgress: number
  upcomingDeadlines: Goal[]
}

export const GoalService = {
  async list(token: string | null): Promise<Goal[]> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.get('/v1/goals', config)
    const payload = response.data?.data
    const items = payload?.items ?? payload
    return Array.isArray(items) ? items : []
  },

  async create(data: GoalInput, token: string | null): Promise<Goal> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.post('/v1/goals', data, config)
    return response.data?.data
  },

  async update(id: string, data: Partial<GoalInput>, token: string | null): Promise<Goal> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.put(`/v1/goals/${id}`, data, config)
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    await api.delete(`/v1/goals/${id}`, config)
  },

  async getSummary(token: string | null): Promise<GoalSummary> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const response = await api.get('/v1/goals/summary', config)
    return response.data?.data
  },
}
