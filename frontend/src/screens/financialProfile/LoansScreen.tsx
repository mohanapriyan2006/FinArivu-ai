import { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Plus } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { YesNoSelector } from '@/components/financialProfile/YesNoSelector'
import { LoanCard } from '@/components/financialProfile/LoanCard'
import type { Loan, LoanProfile } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

function createLoan(): Loan {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'personal',
    outstandingAmount: 0,
    monthlyEmi: 0,
  }
}

export function LoansScreen({ onNext, onBack, onSkip, onExit }: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.loans

  const [hasLoans, setHasLoans] = useState<boolean | undefined>(existing?.hasLoans)
  const [loans, setLoans] = useState<Loan[]>(existing?.loans ?? [])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        addButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.primary,
          borderStyle: 'dashed',
          marginTop: 8,
          minHeight: 52,
        },
        addText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.primary,
          marginLeft: 8,
        },
      }),
    [colors]
  )

  const canContinue =
    hasLoans === false ||
    (hasLoans === true &&
      loans.length > 0 &&
      loans.every(
        (loan) =>
          typeof loan.outstandingAmount === 'number' &&
          typeof loan.monthlyEmi === 'number'
      ))

  const updateLoan = (index: number, loan: Loan) => {
    setLoans((prev) => {
      const next = [...prev]
      next[index] = loan
      return next
    })
  }

  const removeLoan = (index: number) => {
    setLoans((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = async () => {
    if (!canContinue) return
    const data: LoanProfile = {
      hasLoans: hasLoans!,
      loans: hasLoans ? loans : undefined,
    }
    await saveSection({ section: 'loans', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={5}
      totalSteps={13}
      stepTitle="Loans & EMIs"
      title="Do you currently have any loans or EMIs?"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <YesNoSelector
        value={hasLoans}
        onChange={(value) => {
          setHasLoans(value)
          if (value && loans.length === 0) setLoans([createLoan()])
        }}
      />

      {hasLoans ? (
        <>
          {loans.map((loan, index) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onChange={(updated) => updateLoan(index, updated)}
              onDelete={() => removeLoan(index)}
              testID={`loans-card-${index}`}
            />
          ))}
          <Pressable
            onPress={() => setLoans((prev) => [...prev, createLoan()])}
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel="Add another loan"
          >
            <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.addText}>Add another loan</Text>
          </Pressable>
        </>
      ) : null}
    </FinancialProfileStepper>
  )
}
