import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CheckCircle2, Circle } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { ProfileProgressBar } from '@/components/financialProfile/ProfileProgressBar'
import { formatInrNumber } from '@/utils/formatInr'
import { PROFILE_SECTIONS } from '@/utils/profileCompletion'
import type { OnboardingStepId, ProfileSectionId } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const SECTION_TO_STEP: Record<ProfileSectionId, OnboardingStepId> = {
  aboutYou: 'aboutYou',
  income: 'income',
  expenses: 'expenses',
  savings: 'savings',
  investments: 'investments',
  loans: 'loans',
  goals: 'goals',
  fixedDeposits: 'fixedDeposits',
  creditCards: 'creditCards',
  insurance: 'insurance',
  taxDetails: 'taxDetails',
}

interface ProfileCompletionScreenProps extends StepScreenProps {
  goToStep: (stepId: OnboardingStepId) => void
}

export function ProfileCompletionScreen({
  onNext,
  onBack,
  onExit,
  goToStep,
}: ProfileCompletionScreenProps) {
  const { colors } = useTheme()
  const { completion, finishSetup } = useFinancialProfile()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        percent: {
          fontFamily: Typography.fontFamily,
          fontSize: 48,
          fontWeight: Typography.fontWeights.extraBold,
          color: colors.primary,
          textAlign: 'center',
          marginTop: 12,
        },
        percentLabel: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.medium,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 20,
        },
        progress: {
          marginBottom: 24,
        },
        description: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 24,
        },
        sectionList: {
          marginTop: 8,
        },
        sectionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
        },
        sectionText: {
          flex: 1,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.medium,
          color: colors.textPrimary,
          marginLeft: 12,
        },
        sectionValue: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
        },
        completeMore: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          marginTop: 12,
        },
        completeMoreText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.primary,
        },
      }),
    [colors]
  )

  const handleGoToDashboard = async () => {
    await finishSetup()
    onNext()
  }

  const allSections = PROFILE_SECTIONS

  return (
    <FinancialProfileStepper
      currentStepIndex={12}
      totalSteps={13}
      stepTitle="Summary"
      title="Your Personal CFO is ready"
      canContinue={true}
      onBack={onBack}
      onContinue={handleGoToDashboard}
      onExit={onExit}
      continueTitle="Go to Dashboard"
    >
      <Text style={styles.percent}>{completion.percentage}%</Text>
      <Text style={styles.percentLabel}>Profile complete</Text>
      <View style={styles.progress}>
        <ProfileProgressBar percentage={completion.percentage} />
      </View>
      <Text style={styles.description}>
        You've given FinArivu enough information to start. You can always add more later.
      </Text>

      <View style={styles.sectionList}>
        {allSections.map((section) => {
          const status = completion.bySection[section.id]
          const value = status.complete ? formatInrNumber(status.contribution) : ''
          return (
            <Pressable
              key={section.id}
              onPress={() =>
                goToStep(SECTION_TO_STEP[section.id])
              }
              style={styles.sectionRow}
              accessibilityRole="button"
              accessibilityLabel={section.title}
            >
              {status.complete ? (
                <CheckCircle2
                  size={22}
                  color={colors.success}
                  strokeWidth={2.5}
                />
              ) : (
                <Circle
                  size={22}
                  color={colors.textTertiary}
                  strokeWidth={2}
                />
              )}
              <Text style={styles.sectionText}>{section.title}</Text>
              <Text style={styles.sectionValue}>
                {status.complete ? `${section.weight > 0 ? section.weight : ''} ✓` : 'Add'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Pressable
        onPress={() => goToStep('optionalDetails')}
        style={styles.completeMore}
        accessibilityRole="button"
        accessibilityLabel="Complete more details"
      >
        <Text style={styles.completeMoreText}>Complete More Details</Text>
      </Pressable>
    </FinancialProfileStepper>
  )
}
