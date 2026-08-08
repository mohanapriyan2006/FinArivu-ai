import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import { ExpandableAdvancedSection } from '@/components/financialProfile/ExpandableAdvancedSection'
import type { SavingsProfile } from '@/types/financialProfile'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

export function SavingsScreen({ onNext, onBack, onSkip, onExit }: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.savings

  const [total, setTotal] = useState<number | undefined>(existing?.totalSavings)
  const [emergencyFund, setEmergencyFund] = useState<number | undefined>(existing?.emergencyFund)
  const [generalSavings, setGeneralSavings] = useState<number | undefined>(existing?.generalSavings)
  const [goalSavings, setGoalSavings] = useState<number | undefined>(existing?.goalSavings)

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 12,
        },
        half: {
          width: '48%',
        },
      }),
    [colors]
  )

  const canContinue = typeof total === 'number' && total >= 0

  const handleContinue = async () => {
    if (!canContinue) return
    const data: SavingsProfile = {
      totalSavings: total!,
      emergencyFund,
      generalSavings,
      goalSavings,
    }
    await saveSection({ section: 'savings', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={3}
      totalSteps={13}
      stepTitle="Savings"
      title="How much do you currently have saved?"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <MoneyInput
        value={total}
        onChange={setTotal}
        label="Total savings"
      />

      <ExpandableAdvancedSection title="Break down savings">
        <View style={styles.row}>
          <View style={styles.half}>
            <MoneyInput
              value={emergencyFund}
              onChange={setEmergencyFund}
              label="Emergency Fund"
            />
          </View>
          <View style={styles.half}>
            <MoneyInput
              value={generalSavings}
              onChange={setGeneralSavings}
              label="General Savings"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <MoneyInput
              value={goalSavings}
              onChange={setGoalSavings}
              label="Goal Savings"
            />
          </View>
        </View>
      </ExpandableAdvancedSection>
    </FinancialProfileStepper>
  )
}
