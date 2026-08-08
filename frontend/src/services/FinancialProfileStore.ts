import AsyncStorage from '@react-native-async-storage/async-storage'

import type { FinancialProfile, ProfileCompletion, ProfileSectionId, SectionUpdate } from '@/types/financialProfile'
import { calculateCompletion, getLastIncompleteSection } from '@/utils/profileCompletion'

const FINANCIAL_PROFILE_PREFIX = 'finarivu_financial_profile_'

function getKey(userId: string): string {
  return `${FINANCIAL_PROFILE_PREFIX}${userId}`
}

export const FinancialProfileStore = {
  async getProfile(userId: string): Promise<FinancialProfile | null> {
    try {
      const json = await AsyncStorage.getItem(getKey(userId))
      if (!json) return null
      try {
        return JSON.parse(json) as FinancialProfile
      } catch {
        return null
      }
    } catch (error) {
      console.warn('[FinancialProfileStore] getProfile failed:', error)
      return null
    }
  },

  async saveProfile(userId: string, profile: FinancialProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(getKey(userId), JSON.stringify(profile))
    } catch (error) {
      console.warn('[FinancialProfileStore] saveProfile failed:', error)
    }
  },

  async updateSection(
    userId: string,
    update: SectionUpdate
  ): Promise<FinancialProfile> {
    const existing = (await this.getProfile(userId)) ?? { initialized: false }
    const next: FinancialProfile = {
      ...existing,
      userId,
      initialized: true,
      initializedAt: existing.initializedAt ?? new Date().toISOString(),
      [update.section]: update.data,
    }
    await this.saveProfile(userId, next)
    return next
  },

  async getCompletion(userId: string): Promise<ProfileCompletion | null> {
    const profile = await this.getProfile(userId)
    if (!profile) return null
    return calculateCompletion(profile)
  },

  async getLastIncompleteSection(
    userId: string
  ): Promise<ProfileSectionId | null> {
    const profile = await this.getProfile(userId)
    return getLastIncompleteSection(profile)
  },

  async clearProfile(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(getKey(userId))
    } catch (error) {
      console.warn('[FinancialProfileStore] clearProfile failed:', error)
    }
  },
}
