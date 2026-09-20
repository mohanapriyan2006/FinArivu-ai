import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { FlaskConical } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import { scenarioStatusLabel } from '@/hooks/scenarioUiState'
import type { ScenarioApplyAction, ScenarioResult } from '@/types/scenarios'
import { ScenarioAssumptionsList } from './ScenarioAssumptionsList'
import { ScenarioApplyButton } from './ScenarioApplyButton'
import { ScenarioMetricRow } from './ScenarioMetricRow'

interface Props {
  result: ScenarioResult
  /** Bridges apply → Phase 1 action preview (never direct mutation). */
  onApply?: (apply: ScenarioApplyAction) => void | Promise<void>
}

/**
 * Deterministic scenario result — baseline → scenario metrics with
 * disclosed assumptions. Simulations never mutate financial data.
 */
export function ScenarioResultCard({ result, onApply }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const statusColor =
    result.status === 'COMPUTED'
      ? colors.success
      : result.status === 'NEEDS_INPUT'
        ? colors.warning
        : colors.danger

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <FlaskConical size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{result.title || 'Scenario'}</Text>
          {result.scenarioType ? (
            <Text style={styles.subtitle}>
              {result.scenarioType.replace(/_/g, ' ')}
            </Text>
          ) : null}
        </View>
        <View style={[styles.badge, { borderColor: statusColor }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {scenarioStatusLabel(result.status)}
          </Text>
        </View>
      </View>

      {result.summary ? (
        <Text style={styles.summary}>{result.summary}</Text>
      ) : null}

      {result.clarificationQuestion ? (
        <Text style={styles.clarify}>{result.clarificationQuestion}</Text>
      ) : null}

      {result.metrics.length > 0 && (
        <>
          <View style={styles.divider} />
          {result.metrics.map((m) => (
            <ScenarioMetricRow key={m.key} metric={m} />
          ))}
        </>
      )}

      {result.dataQuality !== 'complete' && result.dataMissing.length > 0 && (
        <Text style={styles.partial}>
          Based on partial data — {result.dataMissing.join(', ')} unavailable.
        </Text>
      )}

      {result.alternatives.length > 0 && (
        <View style={styles.alts}>
          {result.alternatives.map((alt, i) => (
            <Text key={`alt-${i}`} style={styles.altText}>
              {alt.label}: {String(alt.postPurchaseBuffer ?? '')}
            </Text>
          ))}
        </View>
      )}

      <ScenarioAssumptionsList assumptions={result.assumptions} />

      {result.applyAction && onApply ? (
        <ScenarioApplyButton apply={result.applyAction} onApply={onApply} />
      ) : null}
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
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    title: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 14,
      fontWeight: '700',
    },
    subtitle: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 1,
      textTransform: 'capitalize',
    },
    badge: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    badgeText: {
      ...Typography.labelSmall,
      fontSize: 10,
      fontWeight: '700',
    },
    summary: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 13,
      marginTop: 10,
      lineHeight: 19,
    },
    clarify: {
      ...Typography.bodyMedium,
      color: colors.warning,
      fontSize: 12,
      marginTop: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
    partial: {
      ...Typography.labelSmall,
      color: colors.warning,
      fontSize: 10,
      marginTop: 6,
    },
    alts: {
      marginTop: 8,
      gap: 3,
    },
    altText: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
    },
  })
