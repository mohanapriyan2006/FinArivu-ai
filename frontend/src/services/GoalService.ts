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
    const response = await api.get('/v1/goals', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? payload : []
  },

  async create(data: GoalInput, token: string | null): Promise<Goal> {
    const response = await api.post('/v1/goals', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async update(id: string, data: Partial<GoalInput>, token: string | null): Promise<Goal> {
    const response = await api.put(`/v1/goals/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },

  async delete(id: string, token: string | null): Promise<void> {
    await api.delete(`/v1/goals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  async getSummary(token: string | null): Promise<GoalSummary> {
    const response = await api.get('/v1/goals/summary', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data
  },
}
