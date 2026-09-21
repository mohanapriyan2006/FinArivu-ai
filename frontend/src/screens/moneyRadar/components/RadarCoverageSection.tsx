import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { DomainCoverage } from '@/types/moneyRadar'

const DOMAIN_LABEL: Record<string, string> = {
  income: 'Income',
  expenses: 'Expenses',
  expense_estimates: 'Expense estimates',
  budgets: 'Budgets',
  goals: 'Goals',
  liabilities: 'Loans & cards',
  savings: 'Savings',
  tax: 'Tax profile',
  net_worth: 'Net worth',
  net_worth_history: 'Net worth history',
}

interface Props {
  coverage: DomainCoverage[]
}

/** Honest coverage — which detectors ran, which were skipped for missing data. */
export function RadarCoverageSection({ coverage }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const missing = coverage.filter((c) => c.availability === 'MISSING')
  const covered = coverage.filter((c) => c.availability !== 'MISSING')

  return (
    <View style={styles.card} testID="radar-coverage">
      <Text style={styles.title}>Coverage</Text>
      <Text style={styles.subtitle}>
        Detectors only run where your data exists — gaps are shown, never filled.
      </Text>
      {coverage.length === 0 ? (
        <Text style={styles.subtitle}>No scan has run yet.</Text>
      ) : (
        <View style={styles.grid}>
          {covered.map((c) => (
            <View key={c.domain} style={styles.row}>
              <CircleCheck size={14} color={colors.success} />
              <Text style={styles.domain}>
                {DOMAIN_LABEL[c.domain] ?? c.domain}
              </Text>
              {c.availability === 'STALE' && (
                <CircleAlert size={12} color={colors.warning} />
              )}
            </View>
          ))}
          {missing.map((c) => (
            <View key={c.domain} style={styles.row}>
              <CircleX size={14} color={colors.textTertiary} />
              <Text style={[styles.domain, styles.domainMissing]}>
                {DOMAIN_LABEL[c.domain] ?? c.domain}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
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
    },
    title: {
      ...Typography.labelSmall,
      color: colors.textHero,
      fontSize: 13,
      fontWeight: '700',
    },
    subtitle: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    domain: {
      ...Typography.labelSmall,
      color: colors.textPrimary,
      fontSize: 11,
      fontWeight: '600',
    },
    domainMissing: {
      color: colors.textTertiary,
    },
  })
