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
import type { Goal } from '@/types/financialProfile'
import { MoneyInput } from './MoneyInput'

interface GoalCardProps {
  goal: Goal
  onChange: (goal: Goal) => void
  onDelete: () => void
  typeLabel: string
  testID?: string
}

export function GoalCard({
  goal,
  onChange,
  onDelete,
  typeLabel,
  testID,
}: GoalCardProps) {
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
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
          marginBottom: 6,
          marginTop: 12,
        },
        input: {
          height: 52,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: 16,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          color: colors.textPrimary,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        flex: {
          flex: 1,
        },
      }),
    [colors]
  )

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>{typeLabel}</Text>
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Delete goal"
          testID={testID ? `${testID}-delete` : undefined}
        >
          <Trash2 size={18} color={colors.danger} strokeWidth={2} />
        </Pressable>
      </View>

      <Text style={styles.label}>Goal name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Bali trip"
        placeholderTextColor={colors.textTertiary}
        value={goal.name}
        onChangeText={(text) => onChange({ ...goal, name: text })}
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <MoneyInput
            value={goal.targetAmount}
            onChange={(value) => onChange({ ...goal, targetAmount: value ?? 0 })}
            label="Target amount"
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.label}>Target year</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 2030"
            placeholderTextColor={colors.textTertiary}
            value={String(goal.targetYear)}
            onChangeText={(text) =>
              onChange({ ...goal, targetYear: Number(text) || 0 })
            }
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <MoneyInput
            value={goal.currentSavedAmount}
            onChange={(value) =>
              onChange({ ...goal, currentSavedAmount: value })
            }
            label="Current saved (optional)"
          />
        </View>
        <View style={styles.flex}>
          <MoneyInput
            value={goal.monthlyContribution}
            onChange={(value) =>
              onChange({ ...goal, monthlyContribution: value })
            }
            label="Monthly contribution (optional)"
          />
        </View>
      </View>
    </View>
  )
}
