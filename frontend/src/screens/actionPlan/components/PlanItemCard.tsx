import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CheckCircle2, Clock, ChevronRight } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import {
  categoryLabel,
  dueWindowLabel,
  priorityLabel,
  statusLabel,
} from '@/hooks/actionPlanUiState'
import type { FinancialPlanItem, PlanItemPriority } from '@/types/actionPlan'

export function priorityColor(
  priority: PlanItemPriority,
  colors: ThemeColors,
): string {
  switch (priority) {
    case 'HIGH':
      return colors.danger
    case 'MEDIUM':
      return colors.warning
    default:
      return colors.secondary
  }
}

interface Props {
  item: FinancialPlanItem
  onPress: (item: FinancialPlanItem) => void
}

/** Compact plan-item row — priority badge + evidence headline + due window. */
export function PlanItemCard({ item, onPress }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const accent = priorityColor(item.priority, colors)
  const done = item.status === 'COMPLETED'
  const snoozed = item.status === 'SNOOZED'

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} — ${priorityLabel(item.priority)}`}
      testID={`plan-item-${item.id}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.chip, { backgroundColor: accent + '1A' }]}>
          <Text style={[styles.chipText, { color: accent }]}>
            {priorityLabel(item.priority)}
          </Text>
        </View>
        <Text style={styles.category}>{categoryLabel(item.category)}</Text>
        {done ? (
          <CheckCircle2 size={16} color={colors.success} />
        ) : snoozed ? (
          <Clock size={14} color={colors.textTertiary} />
        ) : (
          <ChevronRight size={16} color={colors.textTertiary} />
        )}
      </View>

      <Text
        style={[styles.title, done && styles.titleDone]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {item.summary ? (
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {done
            ? `Completed · ${
                item.completionSource === 'ACTION_EXECUTION'
                  ? 'via action'
                  : item.completionSource === 'SYSTEM_RECONCILIATION'
                    ? 'auto-resolved'
                    : 'by you'
              }`
            : snoozed
              ? statusLabel(item.status)
              : dueWindowLabel(item.dueWindow) || 'This week'}
        </Text>
      </View>
    </Pressable>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 10,
    },
    pressed: { opacity: 0.85 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    chip: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    chipText: {
      ...Typography.labelSmall,
      fontSize: 10,
      fontWeight: '700',
    },
    category: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 11,
      flex: 1,
    },
    title: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 8,
    },
    titleDone: { color: colors.textTertiary },
    summary: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 4,
    },
    footer: { marginTop: 10 },
    footerText: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
    },
  })
