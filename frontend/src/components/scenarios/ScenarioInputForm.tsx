import React, { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Play } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ScenarioTypeInfo } from '@/types/scenarios'

interface Props {
  type: ScenarioTypeInfo | null
  submitting: boolean
  onRun: (parameters: Record<string, unknown>) => void
}

/**
 * Parameter fields per scenario type, keyed on the backend
 * `requiredParams`/`paramLabels` contract. Values are sent verbatim — the
 * server validates types and bounds.
 */
const NUMERIC_FIELDS = new Set([
  'change_value',
  'new_monthly_limit',
  'change_amount',
  'additional_monthly',
  'new_monthly_contribution',
  'new_target_amount',
  'purchase_amount',
  'new_retirement_age',
  'new_inflation_rate',
  'prepayment_amount',
  'new_emi',
  'target_months',
  'months_from_now',
])

const OPTIONAL_FIELDS: Record<string, string[]> = {
  INCOME_CHANGE: ['source'],
  CATEGORY_SPENDING_CHANGE: ['category_name'],
  GOAL_CONTRIBUTION_CHANGE: ['goal_name'],
  GOAL_TARGET_CHANGE: ['goal_name'],
  GOAL_DEADLINE_CHANGE: ['goal_name'],
  PURCHASE: ['item_name', 'months_from_now'],
  LOAN_PREPAYMENT: ['loan_name'],
  LOAN_EMI_CHANGE: ['loan_name'],
  EMERGENCY_FUND_TARGET_CHANGE: ['monthly_contribution'],
}

const LABELS: Record<string, string> = {
  change_value: 'Change amount or %',
  new_monthly_limit: 'New monthly limit (₹)',
  change_amount: 'Monthly change (₹)',
  additional_monthly: 'Extra per month (₹)',
  new_monthly_contribution: 'New monthly contribution (₹)',
  new_target_amount: 'New target amount (₹)',
  new_target_date: 'New target date (YYYY-MM-DD)',
  purchase_amount: 'Purchase amount (₹)',
  months_from_now: 'Months from now',
  new_retirement_age: 'Retirement age',
  new_inflation_rate: 'Inflation rate (0.06 = 6%)',
  prepayment_amount: 'Prepayment amount (₹)',
  new_emi: 'New EMI (₹)',
  target_months: 'Months of cover',
  monthly_contribution: 'Monthly contribution (₹)',
  category_name: 'Category name',
  goal_name: 'Goal name',
  loan_name: 'Loan name',
  item_name: 'Item name',
  source: 'Income source',
  change_type: 'Change type (percent / amount / set)',
}

export function ScenarioInputForm({ type, submitting, onRun }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [values, setValues] = useState<Record<string, string>>({})

  if (!type) return null

  const optional = OPTIONAL_FIELDS[type.type] ?? []
  const fields = [...type.requiredParams, ...optional]

  const buildParameters = (): Record<string, unknown> => {
    const params: Record<string, unknown> = {}
    for (const field of fields) {
      const raw = (values[field] ?? '').trim()
      if (!raw) continue
      if (NUMERIC_FIELDS.has(field)) {
        const num = Number(raw.replace(/,/g, ''))
        if (!Number.isFinite(num)) continue
        params[field] = num
      } else {
        params[field] = raw
      }
    }
    // Types that take percent/amount/set get a sensible default changeType.
    if (
      ['INCOME_CHANGE', 'EXPENSE_CHANGE', 'CATEGORY_SPENDING_CHANGE'].includes(
        type.type,
      ) &&
      params.change_value !== undefined &&
      params.change_type === undefined
    ) {
      params.change_type = 'amount'
    }
    return params
  }

  const canRun = type.requiredParams.every(
    (f) => (values[f] ?? '').trim().length > 0,
  )

  return (
    <View style={styles.card}>
      {fields.map((field) => {
        const required = type.requiredParams.includes(field)
        const label =
          type.paramLabels?.[field] ?? LABELS[field] ?? field.replace(/_/g, ' ')
        return (
          <View key={field} style={styles.field}>
            <Text style={styles.label}>
              {label}
              {required ? ' *' : ''}
            </Text>
            <TextInput
              style={styles.input}
              value={values[field] ?? ''}
              onChangeText={(t) =>
                setValues((v) => ({ ...v, [field]: t }))
              }
              placeholder={required ? 'Required' : 'Optional'}
              placeholderTextColor={colors.textTertiary}
              keyboardType={NUMERIC_FIELDS.has(field) ? 'numeric' : 'default'}
            />
          </View>
        )
      })}
      <Pressable
        style={[styles.runButton, (!canRun || submitting) && styles.disabled]}
        onPress={() => canRun && onRun(buildParameters())}
        disabled={!canRun || submitting}
        accessibilityRole="button"
        accessibilityLabel="Run scenario"
      >
        <Play size={14} color={colors.onPrimary} strokeWidth={2.4} />
        <Text style={styles.runText}>
          {submitting ? 'Simulating…' : 'Simulate'}
        </Text>
      </Pressable>
      <Text style={styles.note}>
        Simulations use your real data and never change anything.
      </Text>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginTop: 10,
      gap: 12,
    },
    field: { gap: 5 },
    label: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      fontSize: 14,
    },
    runButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 11,
      marginTop: 2,
    },
    disabled: { opacity: 0.5 },
    runText: {
      ...Typography.labelSmall,
      color: colors.onPrimary,
      fontWeight: '700',
      fontSize: 13,
    },
    note: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      textAlign: 'center',
    },
  })
