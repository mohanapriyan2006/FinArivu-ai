import AsyncStorage from '@react-native-async-storage/async-storage'

import type { FinancialProfile, ProfileCompletion, ProfileSectionId, SectionUpdate } from '@/types/financialProfile'
import { calculateCompletion, getLastIncompleteSection } from '@/utils/profileCompletion'

const FINANCIAL_PROFILE_PREFIX = 'finarivu_financial_profile_'

function getKey(userId: string): string {
  return `${FINANCIAL_PROFILE_PREFIX}${userId}`
}

/**
 * In-memory fallback used when AsyncStorage is unavailable (e.g. web platform
 * without the native module). Keeps the onboarding stepper state coherent
 * within a single session.
 */
const memoryStore: Record<string, string> = {}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key)
  } catch {
    return memoryStore[key] ?? null
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value)
  } catch {
    memoryStore[key] = value
  }
}

async function safeRemoveItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    delete memoryStore[key]
  }
}

export const FinancialProfileStore = {
  async getProfile(userId: string): Promise<FinancialProfile | null> {
    try {
      const json = await safeGetItem(getKey(userId))
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
      await safeSetItem(getKey(userId), JSON.stringify(profile))
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
      await safeRemoveItem(getKey(userId))
    } catch (error) {
      console.warn('[FinancialProfileStore] clearProfile failed:', error)
    }
  },
}
