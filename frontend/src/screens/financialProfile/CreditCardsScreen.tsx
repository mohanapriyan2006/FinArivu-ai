import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import type { CreditCardProfile } from '@/types/financialProfile'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

export function CreditCardsScreen({
  onNext,
  onBack,
  onSkip,
  onExit,
}: StepScreenProps) {
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.creditCards

  const [totalOutstanding, setTotalOutstanding] = useState<number | undefined>(
    existing?.totalOutstanding
  )
  const [typicalMonthlyPayment, setTypicalMonthlyPayment] = useState<
    number | undefined
  >(existing?.typicalMonthlyPayment)
  const [totalCreditLimit, setTotalCreditLimit] = useState<number | undefined>(
    existing?.totalCreditLimit
  )
  const [monthlySpending, setMonthlySpending] = useState<number | undefined>(
    existing?.monthlySpending
  )

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
    []
  )

  const canContinue =
    typeof totalOutstanding === 'number' &&
    typeof typicalMonthlyPayment === 'number'

  const handleContinue = async () => {
    if (!canContinue) return
    const data: CreditCardProfile = {
      totalOutstanding,
      typicalMonthlyPayment,
      totalCreditLimit,
      monthlySpending,
    }
    await saveSection({ section: 'creditCards', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={9}
      totalSteps={13}
      stepTitle="Credit Cards"
      title="Add your credit card details"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <MoneyInput
        value={totalOutstanding}
        onChange={setTotalOutstanding}
        label="Current outstanding amount"
      />
      <MoneyInput
        value={typicalMonthlyPayment}
        onChange={setTypicalMonthlyPayment}
        label="Typical monthly payment"
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <MoneyInput
            value={totalCreditLimit}
            onChange={setTotalCreditLimit}
            label="Total credit limit (optional)"
          />
        </View>
        <View style={styles.half}>
          <MoneyInput
            value={monthlySpending}
            onChange={setMonthlySpending}
            label="Monthly spending (optional)"
          />
        </View>
      </View>
    </FinancialProfileStepper>
  )
}
