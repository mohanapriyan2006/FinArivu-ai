import { useMemo, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import { ExpandableAdvancedSection } from '@/components/financialProfile/ExpandableAdvancedSection'
import type { ExpenseCategory, ExpenseProfile } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'housing', label: 'Housing' },
  { id: 'food', label: 'Food' },
  { id: 'transport', label: 'Transport' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'travel', label: 'Travel' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'other', label: 'Other' },
]

export function ExpensesScreen({ onNext, onBack, onSkip, onExit }: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.expenses

  const [total, setTotal] = useState<number | undefined>(existing?.totalMonthlyExpenses)
  const [breakdown, setBreakdown] = useState<Partial<Record<ExpenseCategory, number>>>(
    existing?.breakdown ?? {}
  )

  const styles = useMemo(
    () =>
      StyleSheet.create({
        helper: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          marginTop: 12,
        },
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
    const data: ExpenseProfile = {
      totalMonthlyExpenses: total!,
      breakdown: Object.keys(breakdown).length > 0 ? breakdown : undefined,
    }
    await saveSection({ section: 'expenses', data })
    onNext()
  }

  const updateBreakdown = (id: ExpenseCategory, value: number | undefined) => {
    setBreakdown((prev) => {
      const next = { ...prev }
      if (value === undefined) {
        delete next[id]
      } else {
        next[id] = value
      }
      return next
    })
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={2}
      totalSteps={13}
      stepTitle="Expenses"
      title="Where does your money usually go?"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <MoneyInput
        value={total}
        onChange={setTotal}
        label="Estimated monthly expenses"
      />
      <Text style={styles.helper}>An estimate is perfectly fine.</Text>

      <ExpandableAdvancedSection title="Break down expenses">
        <View style={styles.row}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.half}>
              <MoneyInput
                value={breakdown[cat.id]}
                onChange={(value) => updateBreakdown(cat.id, value)}
                label={cat.label}
              />
            </View>
          ))}
        </View>
      </ExpandableAdvancedSection>
    </FinancialProfileStepper>
  )
}
