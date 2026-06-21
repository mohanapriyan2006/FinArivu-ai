import { api } from './api'

export interface SyncUserRequest {
  email: string
}

export interface UserProfile {
  id: string
  userId: string
  fullName: string | null
  age: number | null
  city: string | null
  occupation: string | null
  monthlyIncome: number | null
  retirementAge: number | null
  createdAt: string
  updatedAt: string
}

export const UserService = {
  async syncUser(email: string, token: string | null): Promise<UserProfile | null> {
    const response = await api.post(
      '/v1/users/sync',
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data?.data || null
  },
}
