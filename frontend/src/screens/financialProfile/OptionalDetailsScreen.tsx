import { useMemo } from 'react'
import {
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  Building,
  Building2,
  CreditCard,
  Landmark,
  PiggyBank,
  Receipt,
  Shield,
  TrendingUp,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { ProfileSectionCard } from '@/components/financialProfile/ProfileSectionCard'
import type { OnboardingStepId } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const OPTIONAL_CARDS: {
  id: OnboardingStepId
  icon: typeof Shield
  title: string
  description: string
  sectionId: 'fixedDeposits' | 'creditCards' | 'insurance' | 'taxDetails'
}[] = [
  {
    id: 'fixedDeposits',
    icon: PiggyBank,
    title: 'Fixed Deposits',
    description: 'Add FD value and maturity details.',
    sectionId: 'fixedDeposits',
  },
  {
    id: 'insurance',
    icon: Shield,
    title: 'Insurance',
    description: 'Add health and life insurance coverage.',
    sectionId: 'insurance',
  },
  {
    id: 'taxDetails',
    icon: Receipt,
    title: 'Tax Details',
    description: 'Add income, regime and deductions.',
    sectionId: 'taxDetails',
  },
  {
    id: 'creditCards',
    icon: CreditCard,
    title: 'Credit Cards',
    description: 'Add outstanding and monthly payment.',
    sectionId: 'creditCards',
  },
]

interface OptionalDetailsScreenProps extends StepScreenProps {
  goToStep: (stepId: OnboardingStepId) => void
}

export function OptionalDetailsScreen({
  onBack,
  onExit,
  goToStep,
}: OptionalDetailsScreenProps) {
  const { colors } = useTheme()
  const { completion } = useFinancialProfile()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hint: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          marginBottom: 24,
        },
      }),
    [colors]
  )

  const handleFinish = () => goToStep('completion')

  return (
    <FinancialProfileStepper
      currentStepIndex={7}
      totalSteps={13}
      stepTitle="Optional Details"
      title="Add more details if you'd like"
      canContinue={true}
      onBack={onBack}
      onContinue={handleFinish}
      onSkip={handleFinish}
      onExit={onExit}
      continueTitle="Finish Setup"
      skipTitle="Skip for now"
    >
      <Text style={styles.hint}>
        These details are optional but help FinArivu give richer insights. Tap a card to add it, or finish setup.
      </Text>
      {OPTIONAL_CARDS.map((card) => (
        <ProfileSectionCard
          key={card.id}
          icon={card.icon}
          title={card.title}
          description={card.description}
          complete={completion.bySection[card.sectionId]?.complete ?? false}
          onPress={() => goToStep(card.id)}
        />
      ))}
    </FinancialProfileStepper>
  )
}
