import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { ChevronRight, ClipboardList } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'
import type {
  FinancialActionPlan,
  FinancialPlanItem,
} from '@/types/actionPlan'
import { priorityLabel } from '@/hooks/actionPlanUiState'

interface Props {
  /** Raw `financial_action_plan_card` artifact content (serialised plan). */
  data: Record<string, unknown>
}

/** Compact copilot artifact — counts + top priorities + open action. */
export function FinancialPlanCard({ data }: Props) {
  const { colors } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const plan = data as unknown as FinancialActionPlan
  const active = (plan.items ?? [])
    .filter((i) => i.status === 'PENDING' || i.status === 'IN_PROGRESS')
    .slice(0, 3)

  const priorityTint = (p: string) =>
    p === 'HIGH'
      ? colors.danger
      : p === 'MEDIUM'
        ? colors.warning
        : colors.secondary

  return (
    <View style={styles.card} testID="financial-plan-card">
      <View style={styles.header}>
        <ClipboardList size={14} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.title}>My Financial Plan</Text>
        {plan.activeCount > 0 && (
          <View
            style={[styles.badge, { backgroundColor: colors.primary + '1A' }]}
          >
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {plan.activeCount} priorit{plan.activeCount === 1 ? 'y' : 'ies'}
            </Text>
          </View>
        )}
      </View>

      {active.length === 0 ? (
        <Text style={styles.empty}>
          You're on track — no urgent actions this week.
        </Text>
      ) : (
        active.map((item: FinancialPlanItem) => (
          <View key={item.id} style={styles.row}>
            <View
              style={[
                styles.dot,
                { backgroundColor: priorityTint(item.priority) },
              ]}
            />
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.rowPriority}>
              {priorityLabel(item.priority).replace(' priority', '')}
            </Text>
          </View>
        ))
      )}

      <Pressable
        style={styles.open}
        onPress={() => navigation.navigate('FinancialActionPlan')}
        accessibilityRole="button"
        accessibilityLabel="Open Financial Plan"
      >
        <Text style={styles.openText}>Open Plan</Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: 8,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: {
      ...Typography.labelSmall,
      color: colors.textHero,
      fontSize: 13,
      fontWeight: '700',
      flex: 1,
    },
    badge: {
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    badgeText: { fontSize: 10, fontWeight: '700' },
    empty: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    dot: { width: 7, height: 7, borderRadius: 4 },
    rowTitle: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 12,
      flex: 1,
    },
    rowPriority: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: '700',
    },
    open: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 10,
      minHeight: 44,
    },
    openText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
  })
