import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import { YesNoSelector } from '@/components/financialProfile/YesNoSelector'
import { ExpandableAdvancedSection } from '@/components/financialProfile/ExpandableAdvancedSection'
import type { InvestmentBreakdown, InvestmentProfile } from '@/types/financialProfile'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

export function InvestmentsScreen({ onNext, onBack, onSkip, onExit }: StepScreenProps) {
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.investments

  const [hasInvestments, setHasInvestments] = useState<boolean | undefined>(
    existing?.hasInvestments
  )
  const [total, setTotal] = useState<number | undefined>(existing?.totalInvestmentValue)
  const [breakdown, setBreakdown] = useState<InvestmentBreakdown>(
    existing?.breakdown ?? {}
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
    hasInvestments === false ||
    (hasInvestments === true && typeof total === 'number' && total >= 0)

  const updateBreakdown = (key: keyof InvestmentBreakdown, value: number | undefined) => {
    setBreakdown((prev) => {
      const next = { ...prev, [key]: value }
      if (value === undefined) {
        delete next[key]
      }
      return next
    })
  }

  const handleContinue = async () => {
    if (!canContinue) return
    const data: InvestmentProfile = {
      hasInvestments: hasInvestments!,
      totalInvestmentValue: hasInvestments ? total : undefined,
      breakdown: hasInvestments ? breakdown : undefined,
    }
    await saveSection({ section: 'investments', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={4}
      totalSteps={13}
      stepTitle="Investments"
      title="Do you have investments?"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <YesNoSelector
        value={hasInvestments}
        onChange={setHasInvestments}
      />

      {hasInvestments ? (
        <>
          <MoneyInput
            value={total}
            onChange={setTotal}
            label="Approximate total investment value"
          />
          <ExpandableAdvancedSection title="Add investment breakdown">
            <View style={styles.row}>
              <View style={styles.half}>
                <MoneyInput
                  value={breakdown.mutualFunds}
                  onChange={(value) => updateBreakdown('mutualFunds', value)}
                label="Mutual Funds"
                />
              </View>
              <View style={styles.half}>
                <MoneyInput
                  value={breakdown.stocks}
                  onChange={(value) => updateBreakdown('stocks', value)}
                  label="Stocks"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <MoneyInput
                  value={breakdown.ppf}
                  onChange={(value) => updateBreakdown('ppf', value)}
                  label="PPF"
                />
              </View>
              <View style={styles.half}>
                <MoneyInput
                  value={breakdown.nps}
                  onChange={(value) => updateBreakdown('nps', value)}
                  label="NPS"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <MoneyInput
                  value={breakdown.gold}
                  onChange={(value) => updateBreakdown('gold', value)}
                  label="Gold"
                />
              </View>
              <View style={styles.half}>
                <MoneyInput
                  value={breakdown.other}
                  onChange={(value) => updateBreakdown('other', value)}
                  label="Other"
                />
              </View>
            </View>
          </ExpandableAdvancedSection>
        </>
      ) : null}
    </FinancialProfileStepper>
  )
}
