import { api } from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user?: {
    id: string
    email: string
    created_at: string
    updated_at: string
  }
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
}
