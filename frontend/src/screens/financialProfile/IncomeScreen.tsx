import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import { OptionSelector } from '@/components/financialProfile/OptionSelector'
import { ExpandableAdvancedSection } from '@/components/financialProfile/ExpandableAdvancedSection'
import type { IncomeProfile } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const PERIOD_OPTIONS = [
  { value: false, label: 'Monthly' },
  { value: true, label: 'Annual' },
]

export function IncomeScreen({ onNext, onBack, onSkip, onExit }: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.income

  const [amount, setAmount] = useState<number | undefined>(existing?.monthlyTakeHome)
  const [isAnnual, setIsAnnual] = useState<boolean>(existing?.isAnnual ?? false)
  const [bonus, setBonus] = useState<number | undefined>(existing?.additional?.bonus)
  const [freelance, setFreelance] = useState<number | undefined>(existing?.additional?.freelance)
  const [rental, setRental] = useState<number | undefined>(existing?.additional?.rental)
  const [business, setBusiness] = useState<number | undefined>(existing?.additional?.business)
  const [other, setOther] = useState<number | undefined>(existing?.additional?.other)

  const styles = useMemo(
    () =>
      StyleSheet.create({
        helper: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          marginTop: 12,
          marginBottom: 8,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 12,
        },
        flex: {
          flex: 1,
        },
      }),
    [colors]
  )

  const monthlyTakeHome = isAnnual && amount ? Math.round(amount / 12) : amount
  const canContinue = typeof monthlyTakeHome === 'number' && monthlyTakeHome > 0

  const handleContinue = async () => {
    if (!canContinue) return
    const data: IncomeProfile = {
      monthlyTakeHome: monthlyTakeHome!,
      isAnnual,
      additional: {
        bonus,
        freelance,
        rental,
        business,
        other,
      },
    }
    await saveSection({ section: 'income', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={1}
      totalSteps={13}
      stepTitle="Income"
      title="What's your monthly income?"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <MoneyInput
        value={amount}
        onChange={setAmount}
        label="Take-home income"
      />

      <OptionSelector
        options={PERIOD_OPTIONS}
        selected={isAnnual}
        onSelect={(value) => setIsAnnual(value)}
        label="Income period"
        layout="row"
      />

      <Text style={styles.helper}>
        {isAnnual
          ? 'We will use the monthly equivalent for planning.'
          : 'Your take-home salary after all deductions.'}
      </Text>

      <ExpandableAdvancedSection title="Add additional income">
        <View style={styles.row}>
          <View style={styles.flex}>
            <MoneyInput
              value={bonus}
              onChange={setBonus}
              label="Bonus"
            />
          </View>
          <View style={styles.flex}>
            <MoneyInput
              value={freelance}
              onChange={setFreelance}
              label="Freelance"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <MoneyInput
              value={rental}
              onChange={setRental}
              label="Rental"
            />
          </View>
          <View style={styles.flex}>
            <MoneyInput
              value={business}
              onChange={setBusiness}
              label="Business"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <MoneyInput
              value={other}
              onChange={setOther}
              label="Other"
            />
          </View>
        </View>
      </ExpandableAdvancedSection>
    </FinancialProfileStepper>
  )
}
