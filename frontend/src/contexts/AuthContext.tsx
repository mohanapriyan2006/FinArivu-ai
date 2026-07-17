import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

import { AuthService, type UserSummary } from '@/services/AuthService'
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '@/services/api'
import { DISABLE_AUTH, MOCK_BACKEND } from '@/services/mockApi'

interface AuthContextType {
  user: UserSummary | null
  loading: boolean
  isAuthenticated: boolean
  getToken: () => Promise<string | null>
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; fullName?: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function deriveFullName(user: UserSummary): string | undefined {
  return (
    (user.preferences?.fullName as string | undefined) ||
    (user.preferences?.full_name as string | undefined) ||
    user.fullName
  )
}

const mockUser: UserSummary = {
  id: 'mock-user',
  email: 'user@example.com',
  externalId: 'mock-user',
  fullName: 'Test User',
  role: 'USER',
  isActive: true,
  emailVerified: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  preferences: { fullName: 'Test User' },
}

async function loadTokens() {
  const access = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  const refresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  return { access, refresh }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(DISABLE_AUTH ? mockUser : null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (DISABLE_AUTH || MOCK_BACKEND) {
        setLoading(false)
        return
      }
      try {
        const { access } = await loadTokens()
        if (access) {
          const me = await AuthService.me()
          setUser({ ...me, fullName: deriveFullName(me) })
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const getToken = async (): Promise<string | null> => {
    if (MOCK_BACKEND) return 'mock-token'
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  }

  const saveSession = async (tokens: {
    accessToken: string
    refreshToken: string
    user: UserSummary
  }) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken)
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken)
    setUser({ ...tokens.user, fullName: deriveFullName(tokens.user) })
  }

  const login = async (email: string, password: string) => {
    const result = await AuthService.login({ email: email.toLowerCase().trim(), password })
    await saveSession(result)
  }

  const register = async (data: { email: string; password: string; fullName?: string }) => {
    const result = await AuthService.register({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      fullName: data.fullName,
    })
    await saveSession(result)
  }

  const logout = async () => {
    setUser(null)
    try {
      await AuthService.logout()
    } catch {
      // ignore network errors on logout
    } finally {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: DISABLE_AUTH ? mockUser : user,
        loading,
        isAuthenticated: DISABLE_AUTH || !!user,
        getToken,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
