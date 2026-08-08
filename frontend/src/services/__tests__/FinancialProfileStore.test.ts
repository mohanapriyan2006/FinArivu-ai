import AsyncStorage from '@react-native-async-storage/async-storage'

import { FinancialProfileStore } from '../FinancialProfileStore'
import type { FinancialProfile } from '@/types/financialProfile'

const userId = 'test-user'

function getStorageKey(): string {
  return `finarivu_financial_profile_${userId}`
}

describe('FinancialProfileStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null when no profile is stored', async () => {
    const profile = await FinancialProfileStore.getProfile(userId)
    expect(profile).toBeNull()
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(getStorageKey())
  })

  it('saves and loads a profile', async () => {
    const profile: FinancialProfile = {
      initialized: true,
      aboutYou: { age: 28, employmentType: 'salaried', city: 'Bengaluru' },
      income: { monthlyTakeHome: 75000, isAnnual: false },
    }

    await FinancialProfileStore.saveProfile(userId, profile)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getStorageKey(),
      JSON.stringify(profile)
    )

    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(profile)
    )

    const loaded = await FinancialProfileStore.getProfile(userId)
    expect(loaded).toEqual(profile)
  })

  it('updateSection marks profile as initialized and saves', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)

    const next = await FinancialProfileStore.updateSection(userId, {
      section: 'income',
      data: { monthlyTakeHome: 75000, isAnnual: false },
    })

    expect(next.initialized).toBe(true)
    expect(next.income).toEqual({ monthlyTakeHome: 75000, isAnnual: false })
    expect(AsyncStorage.setItem).toHaveBeenCalled()
  })

  it('getCompletion returns null when no profile exists', async () => {
    const completion = await FinancialProfileStore.getCompletion(userId)
    expect(completion).toBeNull()
  })

  it('getLastIncompleteSection returns the first incomplete section', async () => {
    const profile: FinancialProfile = {
      initialized: true,
      aboutYou: { age: 28, employmentType: 'salaried', city: 'Bengaluru' },
    }

    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(profile)
    )

    const section = await FinancialProfileStore.getLastIncompleteSection(userId)
    expect(section).toBe('income')
  })

  it('clearProfile removes stored data', async () => {
    await FinancialProfileStore.clearProfile(userId)
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getStorageKey())
  })
})
