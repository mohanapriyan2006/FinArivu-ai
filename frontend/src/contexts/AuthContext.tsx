import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

import { DISABLE_AUTH, MOCK_BACKEND } from '@/services/mockApi'

const TOKEN_KEY = 'finarivu_access_token'

interface UserProfile {
  id: string
  fullName: string | null
  age: number | null
  city: string | null
  occupation: string | null
  monthlyIncome: number | null
  retirementAge: number | null
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  getToken: () => Promise<string | null>
  setToken: (token: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const mockUser: UserProfile = {
  id: 'mock-user',
  fullName: 'Test User',
  age: 30,
  city: 'Mumbai',
  occupation: 'Engineer',
  monthlyIncome: 100000,
  retirementAge: 60,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DISABLE_AUTH ? mockUser : null)
  const [token, setTokenState] = useState<string | null>(DISABLE_AUTH ? 'mock-token' : null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (DISABLE_AUTH || MOCK_BACKEND) {
        // In mock mode we start without a token unless auth is fully disabled.
        setLoading(false)
        return
      }
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY)
        setTokenState(storedToken)
      } catch {
        setTokenState(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const getToken = async (): Promise<string | null> => {
    if (MOCK_BACKEND) return token
    return SecureStore.getItemAsync(TOKEN_KEY)
  }

  const setToken = async (newToken: string): Promise<void> => {
    setTokenState(newToken)
    if (!MOCK_BACKEND) {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken)
    }
  }

  const logout = async (): Promise<void> => {
    setTokenState(null)
    setUser(null)
    if (!MOCK_BACKEND) {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: DISABLE_AUTH ? mockUser : user,
        loading,
        isAuthenticated: DISABLE_AUTH || !!token,
        getToken,
        setToken,
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
