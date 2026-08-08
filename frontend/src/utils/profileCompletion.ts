import type {
  FinancialProfile,
  ProfileCompletion,
  ProfileSectionConfig,
  ProfileSectionId,
} from '@/types/financialProfile'

export const PROFILE_COMPLETION_THRESHOLD = 70

export const PROFILE_SECTIONS: ProfileSectionConfig[] = [
  {
    id: 'aboutYou',
    title: 'About You',
    shortTitle: 'About You',
    weight: 10,
    isOptional: false,
    isComplete: (profile) =>
      !!profile.aboutYou &&
      profile.aboutYou.age > 0 &&
      profile.aboutYou.employmentType.length > 0 &&
      profile.aboutYou.city.length > 0,
  },
  {
    id: 'income',
    title: 'Income',
    shortTitle: 'Income',
    weight: 15,
    isOptional: false,
    isComplete: (profile) =>
      !!profile.income &&
      typeof profile.income.monthlyTakeHome === 'number' &&
      profile.income.monthlyTakeHome > 0,
  },
  {
    id: 'expenses',
    title: 'Expenses',
    shortTitle: 'Expenses',
    weight: 20,
    isOptional: false,
    isComplete: (profile) =>
      !!profile.expenses &&
      typeof profile.expenses.totalMonthlyExpenses === 'number' &&
      profile.expenses.totalMonthlyExpenses >= 0,
  },
  {
    id: 'savings',
    title: 'Savings',
    shortTitle: 'Savings',
    weight: 15,
    isOptional: false,
    isComplete: (profile) =>
      !!profile.savings &&
      typeof profile.savings.totalSavings === 'number' &&
      profile.savings.totalSavings >= 0,
  },
  {
    id: 'investments',
    title: 'Investments',
    shortTitle: 'Investments',
    weight: 15,
    isOptional: false,
    isComplete: (profile) => {
      if (!profile.investments) return false
      if (profile.investments.hasInvestments === false) return true
      if (profile.investments.hasInvestments === true) {
        return (
          typeof profile.investments.totalInvestmentValue === 'number' &&
          profile.investments.totalInvestmentValue >= 0
        )
      }
      return false
    },
  },
  {
    id: 'loans',
    title: 'Loans & EMIs',
    shortTitle: 'Loans',
    weight: 10,
    isOptional: false,
    isComplete: (profile) => {
      if (!profile.loans) return false
      if (profile.loans.hasLoans === false) return true
      if (profile.loans.hasLoans === true) {
        return (
          Array.isArray(profile.loans.loans) &&
          profile.loans.loans.length > 0 &&
          profile.loans.loans.every(
            (loan) =>
              typeof loan.outstandingAmount === 'number' &&
              loan.outstandingAmount >= 0 &&
              typeof loan.monthlyEmi === 'number' &&
              loan.monthlyEmi >= 0
          )
        )
      }
      return false
    },
  },
  {
    id: 'goals',
    title: 'Goals',
    shortTitle: 'Goals',
    weight: 15,
    isOptional: false,
    isComplete: (profile) => {
      if (!profile.goals) return false
      return (
        Array.isArray(profile.goals.goals) &&
        profile.goals.goals.length > 0 &&
        profile.goals.goals.every(
          (goal) =>
            goal.type.length > 0 &&
            goal.name.length > 0 &&
            typeof goal.targetAmount === 'number' &&
            goal.targetAmount > 0 &&
            typeof goal.targetYear === 'number' &&
            goal.targetYear > 0
        )
      )
    },
  },
  {
    id: 'fixedDeposits',
    title: 'Fixed Deposits',
    shortTitle: 'Fixed Deposits',
    weight: 0,
    isOptional: true,
    isComplete: (profile) =>
      !!profile.fixedDeposits &&
      typeof profile.fixedDeposits.totalValue === 'number' &&
      profile.fixedDeposits.totalValue >= 0,
  },
  {
    id: 'creditCards',
    title: 'Credit Cards',
    shortTitle: 'Credit Cards',
    weight: 0,
    isOptional: true,
    isComplete: (profile) =>
      !!profile.creditCards &&
      typeof profile.creditCards.totalOutstanding === 'number' &&
      profile.creditCards.totalOutstanding >= 0 &&
      typeof profile.creditCards.typicalMonthlyPayment === 'number' &&
      profile.creditCards.typicalMonthlyPayment >= 0,
  },
  {
    id: 'insurance',
    title: 'Insurance',
    shortTitle: 'Insurance',
    weight: 0,
    isOptional: true,
    isComplete: (profile) =>
      !!profile.insurance &&
      Array.isArray(profile.insurance.policies) &&
      profile.insurance.policies.length > 0,
  },
  {
    id: 'taxDetails',
    title: 'Tax Details',
    shortTitle: 'Tax',
    weight: 0,
    isOptional: true,
    isComplete: (profile) =>
      !!profile.taxDetails &&
      typeof profile.taxDetails.annualIncome === 'number' &&
      profile.taxDetails.annualIncome >= 0 &&
      profile.taxDetails.taxRegime.length > 0,
  },
]

const CORE_SECTIONS = PROFILE_SECTIONS.filter((section) => !section.isOptional)
const SECTION_ORDER: ProfileSectionId[] = [
  'aboutYou',
  'income',
  'expenses',
  'savings',
  'investments',
  'loans',
  'goals',
  'fixedDeposits',
  'creditCards',
  'insurance',
  'taxDetails',
]

export function calculateCompletion(
  profile: FinancialProfile | null
): ProfileCompletion {
  const safeProfile: FinancialProfile = profile ?? { initialized: false }
  const bySection = {} as Record<ProfileSectionId, ProfileCompletion['bySection'][ProfileSectionId]>
  let percentage = 0

  const completedSections: ProfileSectionId[] = []
  const incompleteSections: ProfileSectionId[] = []

  for (const section of PROFILE_SECTIONS) {
    const complete = section.isComplete(safeProfile)
    const contribution = complete ? section.weight : 0
    bySection[section.id] = {
      id: section.id,
      title: section.title,
      shortTitle: section.shortTitle,
      weight: section.weight,
      complete,
      contribution,
    }
    percentage += contribution
    if (complete) {
      completedSections.push(section.id)
    } else {
      incompleteSections.push(section.id)
    }
  }

  const lastIncompleteSection =
    CORE_SECTIONS.find(
      (section) => !bySection[section.id]?.complete
    )?.id ?? null

  const missingSections = incompleteSections

  return {
    percentage: Math.min(100, Math.max(0, percentage)),
    completedSections,
    incompleteSections,
    missingSections,
    lastIncompleteSection,
    bySection,
  }
}

export function getCoreCompletion(profile: FinancialProfile | null): number {
  const completion = calculateCompletion(profile)
  return CORE_SECTIONS.reduce(
    (sum, section) => sum + completion.bySection[section.id].contribution,
    0
  )
}

export function isProfileInitialized(profile: FinancialProfile | null): boolean {
  return !!profile && profile.initialized === true
}

export function getLastIncompleteSection(
  profile: FinancialProfile | null
): ProfileSectionId | null {
  return calculateCompletion(profile).lastIncompleteSection
}
