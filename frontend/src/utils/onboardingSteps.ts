import type { OnboardingStepId } from '@/types/financialProfile'

export interface OnboardingStep {
  id: OnboardingStepId
  title: string
  shortTitle: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'aboutYou', title: "Let's get to know you", shortTitle: 'About You' },
  { id: 'income', title: "What's your monthly income?", shortTitle: 'Income' },
  { id: 'expenses', title: 'Where does your money usually go?', shortTitle: 'Expenses' },
  { id: 'savings', title: 'How much do you currently have saved?', shortTitle: 'Savings' },
  { id: 'investments', title: 'Do you have investments?', shortTitle: 'Investments' },
  { id: 'loans', title: 'Do you currently have any loans or EMIs?', shortTitle: 'Loans' },
  { id: 'goals', title: 'What are you planning for?', shortTitle: 'Goals' },
  { id: 'optionalDetails', title: 'Add more details if you\'d like', shortTitle: 'Optional Details' },
  { id: 'fixedDeposits', title: 'Fixed Deposits', shortTitle: 'Fixed Deposits' },
  { id: 'creditCards', title: 'Credit Cards', shortTitle: 'Credit Cards' },
  { id: 'insurance', title: 'Insurance', shortTitle: 'Insurance' },
  { id: 'taxDetails', title: 'Tax Details', shortTitle: 'Tax' },
  { id: 'completion', title: 'Your Personal CFO is ready', shortTitle: 'Summary' },
]

export const ONBOARDING_STEP_INDEX: Record<OnboardingStepId, number> =
  ONBOARDING_STEPS.reduce((acc, step, index) => {
    acc[step.id] = index
    return acc
  }, {} as Record<OnboardingStepId, number>)

export function getStepIndex(stepId: OnboardingStepId): number {
  return ONBOARDING_STEP_INDEX[stepId] ?? 0
}

export function getNextStepId(stepId: OnboardingStepId): OnboardingStepId | null {
  const index = getStepIndex(stepId)
  return ONBOARDING_STEPS[index + 1]?.id ?? null
}

export function getPreviousStepId(stepId: OnboardingStepId): OnboardingStepId | null {
  const index = getStepIndex(stepId)
  return ONBOARDING_STEPS[index - 1]?.id ?? null
}

export function getStepById(stepId: OnboardingStepId): OnboardingStep {
  return ONBOARDING_STEPS[getStepIndex(stepId)]
}
