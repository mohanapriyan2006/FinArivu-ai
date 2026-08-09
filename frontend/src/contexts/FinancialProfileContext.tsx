import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type {
  FinancialProfile,
  OnboardingStepId,
  ProfileCompletion,
  SectionUpdate,
} from '@/types/financialProfile'
import { useAuthContext } from './AuthContext'
import { FinancialProfileService } from '@/services/FinancialProfileService'
import { calculateCompletion } from '@/utils/profileCompletion'

interface FinancialProfileContextType {
  profile: FinancialProfile
  loading: boolean
  initialized: boolean
  completion: ProfileCompletion
  dismissed: boolean
  dismissPrompt: () => void
  saveSection: (update: SectionUpdate) => Promise<void>
  finishSetup: () => Promise<void>
  exitSetup: () => Promise<void>
  clearProfile: () => Promise<void>
  resumeStep: OnboardingStepId
}

const defaultProfile: FinancialProfile = { initialized: false }

const FinancialProfileContext = createContext<FinancialProfileContextType | null>(null)

export function FinancialProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, getToken } = useAuthContext()
  const userId = user?.id ?? 'anonymous'

  const [profile, setProfile] = useState<FinancialProfile>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const stored = await FinancialProfileService.getProfile(userId, token)
      setProfile(stored ?? defaultProfile)
    } catch (error) {
      console.warn('[FinancialProfileProvider] load failed:', error)
      setProfile(defaultProfile)
    } finally {
      setLoading(false)
    }
  }, [userId, getToken])

  useEffect(() => {
    load()
  }, [load])

  const completion = useMemo(
    () => calculateCompletion(profile),
    [profile]
  )

  const resumeStep: OnboardingStepId = useMemo(() => {
    if (!profile.initialized) return 'aboutYou'
    return (completion.lastIncompleteSection as OnboardingStepId) ?? 'completion'
  }, [completion.lastIncompleteSection, profile.initialized])

  const saveSection = useCallback(
    async (update: SectionUpdate) => {
      const token = await getToken()
      const next = await FinancialProfileService.updateProfileSection(userId, update, token)
      setProfile(next)
    },
    [userId, getToken]
  )

  const finishSetup = useCallback(async () => {
    const next: FinancialProfile = {
      ...profile,
      completedAt: new Date().toISOString(),
    }
    await FinancialProfileService.saveProfile(userId, next)
    setProfile(next)
  }, [profile, userId])

  const exitSetup = useCallback(async () => {
    if (!profile.initialized) {
      const next: FinancialProfile = { ...profile, initialized: true }
      await FinancialProfileService.saveProfile(userId, next)
      setProfile(next)
    }
  }, [profile, userId])

  const clearProfile = useCallback(async () => {
    await FinancialProfileService.saveProfile(userId, defaultProfile)
    setProfile(defaultProfile)
  }, [userId])

  const dismissPrompt = useCallback(() => setDismissed(true), [])

  const value: FinancialProfileContextType = {
    profile,
    loading,
    initialized: profile.initialized,
    completion,
    dismissed,
    dismissPrompt,
    saveSection,
    finishSetup,
    exitSetup,
    clearProfile,
    resumeStep,
  }

  return (
    <FinancialProfileContext.Provider value={value}>
      {children}
    </FinancialProfileContext.Provider>
  )
}

export function useFinancialProfile(): FinancialProfileContextType {
  const context = useContext(FinancialProfileContext)
  if (!context) {
    throw new Error('useFinancialProfile must be used within a FinancialProfileProvider')
  }
  return context
}
