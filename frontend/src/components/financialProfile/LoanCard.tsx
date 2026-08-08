import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Trash2 } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { Loan, LoanType } from '@/types/financialProfile'
import { OptionSelector } from './OptionSelector'
import { MoneyInput } from './MoneyInput'

interface LoanCardProps {
  loan: Loan
  onChange: (loan: Loan) => void
  onDelete: () => void
  testID?: string
}

const LOAN_OPTIONS: { value: LoanType; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'personal', label: 'Personal' },
  { value: 'car', label: 'Car' },
  { value: 'education', label: 'Education' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'other', label: 'Other' },
]

export function LoanCard({
  loan,
  onChange,
  onDelete,
  testID,
}: LoanCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
        },
        deleteButton: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.dangerBackground,
          alignItems: 'center',
          justifyContent: 'center',
        },
        row: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 12,
        },
        flex: {
          flex: 1,
        },
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
          marginBottom: 6,
        },
        input: {
          height: 48,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: 14,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          color: colors.textPrimary,
        },
      }),
    [colors]
  )

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Loan</Text>
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Delete loan"
          testID={testID ? `${testID}-delete` : undefined}
        >
          <Trash2 size={18} color={colors.danger} strokeWidth={2} />
        </Pressable>
      </View>

      <OptionSelector
        options={LOAN_OPTIONS}
        selected={loan.type}
        onSelect={(value) => onChange({ ...loan, type: value })}
        label="Loan type"
        layout="wrap"
        testID={testID ? `${testID}-type` : undefined}
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <MoneyInput
            value={loan.outstandingAmount}
            onChange={(value) =>
              onChange({ ...loan, outstandingAmount: value ?? 0 })
            }
            label="Outstanding amount"
          />
        </View>
        <View style={styles.flex}>
          <MoneyInput
            value={loan.monthlyEmi}
            onChange={(value) =>
              onChange({ ...loan, monthlyEmi: value ?? 0 })
            }
            label="Monthly EMI"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.label}>Interest rate (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Optional"
            placeholderTextColor={colors.textTertiary}
            value={
              loan.interestRate === undefined ? '' : String(loan.interestRate)
            }
            onChangeText={(text) => {
              const value = text === '' ? undefined : Number(text)
              onChange({ ...loan, interestRate: value })
            }}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.label}>Remaining tenure (months)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Optional"
            placeholderTextColor={colors.textTertiary}
            value={
              loan.remainingTenure === undefined
                ? ''
                : String(loan.remainingTenure)
            }
            onChangeText={(text) => {
              const value = text === '' ? undefined : Number(text)
              onChange({ ...loan, remainingTenure: value })
            }}
          />
        </View>
      </View>
    </View>
  )
}
