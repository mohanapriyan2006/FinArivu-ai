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
  avatarUrl?: string | null
  avatar_url?: string | null
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
  avatarUrl?: string
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

  async uploadAvatar(fileUri: string, token: string): Promise<{ avatarUrl: string }> {
    const fileName = fileUri.split('/').pop() || 'avatar.jpg'
    const ext = fileName.split('.').pop()?.toLowerCase()
    let type = 'image/jpeg'
    if (ext === 'png') {
      type = 'image/png'
    } else if (ext === 'webp') {
      type = 'image/webp'
    }

    const formData = new FormData()
    formData.append('file', { uri: fileUri, name: fileName, type } as any)

    const response = await fetch(`${api.defaults.baseURL}/v1/profiles/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Avatar upload failed')
    }

    const json = await response.json()
    return { avatarUrl: json.data?.avatarUrl ?? json.data?.avatar_url ?? '' }
  },
}
