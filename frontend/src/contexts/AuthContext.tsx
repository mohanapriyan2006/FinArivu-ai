import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo'

import { UserService } from '@/services/UserService'

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
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const { signOut, getToken } = useClerkAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function syncUser() {
      if (!clerkUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const token = await getToken()
        const email = clerkUser.primaryEmailAddress?.emailAddress || ''
        const profile = await UserService.syncUser(email, token)
        setUser(profile)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    if (userLoaded) {
      syncUser()
    }
  }, [clerkUser, userLoaded])

  const login = () => {
    // Navigation handled by navigator
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!clerkUser,
        login,
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
