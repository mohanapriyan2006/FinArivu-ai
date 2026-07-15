import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'finarivu_access_token'
const DISABLE_AUTH = process.env.EXPO_PUBLIC_DISABLE_AUTH === 'true'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (DISABLE_AUTH) {
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
    return SecureStore.getItemAsync(TOKEN_KEY)
  }

  const setToken = async (newToken: string): Promise<void> => {
    if (DISABLE_AUTH) {
      setTokenState(newToken)
      return
    }
    await SecureStore.setItemAsync(TOKEN_KEY, newToken)
    setTokenState(newToken)
  }

  const logout = async (): Promise<void> => {
    if (DISABLE_AUTH) {
      setUser(null)
      return
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setTokenState(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
