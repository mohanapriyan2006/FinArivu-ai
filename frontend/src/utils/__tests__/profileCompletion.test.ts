import {
  calculateCompletion,
  getLastIncompleteSection,
  isProfileInitialized,
  PROFILE_COMPLETION_THRESHOLD,
} from '../profileCompletion'
import type { FinancialProfile } from '@/types/financialProfile'

describe('profileCompletion', () => {
  it('exposes a configurable 70% threshold', () => {
    expect(PROFILE_COMPLETION_THRESHOLD).toBe(70)
  })

  it('returns 0% for an empty profile', () => {
    const result = calculateCompletion({ initialized: false })
    expect(result.percentage).toBe(0)
    expect(result.completedSections).toEqual([])
    expect(result.incompleteSections.length).toBeGreaterThan(0)
    expect(result.lastIncompleteSection).toBe('aboutYou')
  })

  it('calculates full completion for a complete profile', () => {
    const profile: FinancialProfile = {
      initialized: true,
      aboutYou: { age: 28, employmentType: 'salaried', city: 'Bengaluru' },
      income: { monthlyTakeHome: 75000, isAnnual: false },
      expenses: { totalMonthlyExpenses: 42000 },
      savings: { totalSavings: 250000 },
      investments: { hasInvestments: false },
      loans: { hasLoans: false },
      goals: {
        goals: [
          {
            id: 'g1',
            type: 'home',
            name: 'Home',
            targetAmount: 5000000,
            targetYear: 2035,
          },
        ],
      },
    }

    const result = calculateCompletion(profile)
    expect(result.percentage).toBe(100)
    expect(result.completedSections).toContain('aboutYou')
    expect(result.completedSections).toContain('income')
    expect(result.completedSections).toContain('expenses')
    expect(result.completedSections).toContain('savings')
    expect(result.completedSections).toContain('investments')
    expect(result.completedSections).toContain('loans')
    expect(result.completedSections).toContain('goals')
    expect(result.lastIncompleteSection).toBeNull()
  })

  it('does not let optional sections block 100%', () => {
    const profile: FinancialProfile = {
      initialized: true,
      aboutYou: { age: 28, employmentType: 'salaried', city: 'Bengaluru' },
      income: { monthlyTakeHome: 75000, isAnnual: false },
      expenses: { totalMonthlyExpenses: 42000 },
      savings: { totalSavings: 250000 },
      investments: { hasInvestments: false },
      loans: { hasLoans: false },
      goals: {
        goals: [
          {
            id: 'g1',
            type: 'home',
            name: 'Home',
            targetAmount: 5000000,
            targetYear: 2035,
          },
        ],
      },
    }

    const result = calculateCompletion(profile)
    expect(result.percentage).toBe(100)
  })

  it('returns the next incomplete section in order', () => {
    const profile: FinancialProfile = {
      initialized: true,
      aboutYou: { age: 28, employmentType: 'salaried', city: 'Bengaluru' },
      income: { monthlyTakeHome: 75000, isAnnual: false },
    }

    const result = calculateCompletion(profile)
    expect(result.percentage).toBe(25)
    expect(result.lastIncompleteSection).toBe('expenses')
    expect(getLastIncompleteSection(profile)).toBe('expenses')
  })

  it('detects a partially initialized profile', () => {
    expect(isProfileInitialized(null)).toBe(false)
    expect(isProfileInitialized({ initialized: false })).toBe(false)
    expect(isProfileInitialized({ initialized: true, income: { monthlyTakeHome: 1, isAnnual: false } })).toBe(true)
  })
})
