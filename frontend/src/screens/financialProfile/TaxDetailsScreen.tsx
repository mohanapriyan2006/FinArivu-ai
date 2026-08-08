import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import { OptionSelector } from '@/components/financialProfile/OptionSelector'
import { ExpandableAdvancedSection } from '@/components/financialProfile/ExpandableAdvancedSection'
import type { TaxProfile, TaxRegime } from '@/types/financialProfile'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const REGIME_OPTIONS: { value: TaxRegime; label: string }[] = [
  { value: 'old', label: 'Old' },
  { value: 'new', label: 'New' },
  { value: 'not-sure', label: 'Not sure' },
]

export function TaxDetailsScreen({
  onNext,
  onBack,
  onSkip,
  onExit,
}: StepScreenProps) {
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.taxDetails

  const [annualIncome, setAnnualIncome] = useState<number | undefined>(
    existing?.annualIncome
  )
  const [taxRegime, setTaxRegime] = useState<TaxRegime | undefined>(
    existing?.taxRegime
  )
  const [deduction80c, setDeduction80c] = useState<number | undefined>(
    existing?.deductions?.['80c']
  )
  const [deduction80d, setDeduction80d] = useState<number | undefined>(
    existing?.deductions?.['80d']
  )
  const [homeLoanInterest, setHomeLoanInterest] = useState<number | undefined>(
    existing?.deductions?.homeLoanInterest
  )
  const [nps, setNps] = useState<number | undefined>(
    existing?.deductions?.nps
  )
  const [otherDeductions, setOtherDeductions] = useState<number | undefined>(
    existing?.deductions?.other
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
    typeof annualIncome === 'number' &&
    annualIncome >= 0 &&
    !!taxRegime

  const handleContinue = async () => {
    if (!canContinue) return
    const data: TaxProfile = {
      annualIncome: annualIncome!,
      taxRegime: taxRegime!,
      deductions: {
        '80c': deduction80c,
        '80d': deduction80d,
        homeLoanInterest,
        nps,
        other: otherDeductions,
      },
    }
    await saveSection({ section: 'taxDetails', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={11}
      totalSteps={13}
      stepTitle="Tax Details"
      title="Add your tax details"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <MoneyInput
        value={annualIncome}
        onChange={setAnnualIncome}
        label="Annual income"
      />

      <OptionSelector
        options={REGIME_OPTIONS}
        selected={taxRegime}
        onSelect={(value) => setTaxRegime(value)}
        label="Current tax regime"
        layout="row"
      />

      <ExpandableAdvancedSection title="Add deductions">
        <View style={styles.row}>
          <View style={styles.half}>
            <MoneyInput
              value={deduction80c}
              onChange={setDeduction80c}
              label="80C"
            />
          </View>
          <View style={styles.half}>
            <MoneyInput
              value={deduction80d}
              onChange={setDeduction80d}
              label="80D"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <MoneyInput
              value={homeLoanInterest}
              onChange={setHomeLoanInterest}
              label="Home loan interest"
            />
          </View>
          <View style={styles.half}>
            <MoneyInput
              value={nps}
              onChange={setNps}
              label="NPS"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <MoneyInput
              value={otherDeductions}
              onChange={setOtherDeductions}
              label="Other deductions"
            />
          </View>
        </View>
      </ExpandableAdvancedSection>
    </FinancialProfileStepper>
  )
}
