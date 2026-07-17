import { api } from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName?: string
}

export interface UserSummary {
  id: string
  email: string
  externalId: string
  fullName?: string
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  preferences?: Record<string, unknown> | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserSummary
}

export interface RefreshResponse {
  accessToken: string
  tokenType: string
}

export const AuthService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/v1/auth/login', data)
    return response.data?.data
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/v1/auth/register', data)
    return response.data?.data
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await api.post(
      '/v1/auth/refresh',
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    )
    return response.data?.data
  },

  async logout(): Promise<void> {
    await api.post('/v1/auth/logout', {})
  },

  async me(): Promise<UserSummary> {
    const response = await api.get('/v1/auth/me')
    return response.data?.data
  },
}
