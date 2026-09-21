import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Landmark,
  PiggyBank,
  Receipt,
  RefreshCcw,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import {
  formatEvidenceValue,
  freshnessLabel,
  severityLabel,
} from '@/hooks/moneyRadarUiState'
import type { InsightSeverity, RadarInsight } from '@/types/moneyRadar'

const TYPE_ICON: Record<string, typeof Receipt> = {
  SPENDING_SPIKE: Receipt,
  BUDGET_RISK: AlertTriangle,
  CASHFLOW_RISK: Wallet,
  GOAL_DELAY: Target,
  DEBT_OPPORTUNITY: Landmark,
  EMERGENCY_FUND_RISK: PiggyBank,
  TAX_OPPORTUNITY: CreditCard,
  RECURRING_COST: RefreshCcw,
  NETWORTH_CHANGE: TrendingUp,
}

export function severityColor(
  severity: InsightSeverity,
  colors: ThemeColors,
): string {
  switch (severity) {
    case 'HIGH':
      return colors.danger
    case 'MEDIUM':
      return colors.warning
    case 'LOW':
      return colors.secondary
    default:
      return colors.textTertiary
  }
}

interface Props {
  insight: RadarInsight
  onPress: (insight: RadarInsight) => void
}

/** Compact insight row — title, severity chip, headline metric, freshness. */
export function RadarInsightCard({ insight, onPress }: Props) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const accent = severityColor(insight.severity, colors)
  const Icon = TYPE_ICON[insight.insightType] ?? AlertTriangle
  const headline = insight.evidence.find((e) => e.key === 'relative_change')
  const freshness = freshnessLabel(insight.freshness)

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(insight)}
      accessibilityRole="button"
      accessibilityLabel={`${severityLabel(insight.severity)}: ${insight.title}`}
      testID={`radar-insight-${insight.id}`}
    >
      <View style={[styles.iconRing, { borderColor: accent + '55' }]}>
        <Icon size={18} color={accent} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {insight.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {insight.summary}
        </Text>
        {headline ? (
          <Text style={[styles.metric, { color: accent }]}>
            {formatEvidenceValue(headline)} · {insight.impact.metricLabel}
          </Text>
        ) : null}
        {freshness ? (
          <Text style={styles.freshness}>{freshness}</Text>
        ) : null}
      </View>
      <View style={[styles.chip, { backgroundColor: accent + '1A' }]}>
        <Text style={[styles.chipText, { color: accent }]}>
          {severityLabel(insight.severity)}
        </Text>
        <ArrowUpRight size={12} color={accent} />
      </View>
    </Pressable>
  )
}

const makeStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
      gap: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    iconRing: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? colors.primaryBackground
        : colors.background,
    },
    body: { flex: 1 },
    title: {
      ...Typography.labelSmall,
      color: colors.textHero,
      fontSize: 14,
      fontWeight: '700',
    },
    summary: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
    },
    metric: {
      ...Typography.labelSmall,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 6,
    },
    freshness: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    chipText: {
      ...Typography.labelSmall,
      fontSize: 10,
      fontWeight: '700',
    },
  })
