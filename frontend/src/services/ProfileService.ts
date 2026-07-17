import { api } from './api'

export interface Profile {
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

export interface ProfileInput {
  fullName?: string
  age?: number
  city?: string
  occupation?: string
  monthlyIncome?: number
  retirementAge?: number
}

export const ProfileService = {
  async getProfile(token: string | null): Promise<Profile | null> {
    const response = await api.get('/v1/profiles/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data || null
  },

  async saveProfile(data: ProfileInput, token: string | null): Promise<Profile | null> {
    const response = await api.put('/v1/profiles/me', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data || null
  },

  async updateProfile(data: ProfileInput, token: string | null): Promise<Profile | null> {
    const response = await api.put('/v1/profiles/me', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data || null
  },
}
