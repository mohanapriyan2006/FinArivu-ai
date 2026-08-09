import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { WeeklyMetric } from '../types'

interface WeeklySummaryProps {
  metrics: WeeklyMetric[]
  testID?: string
}

export function WeeklySummary({ metrics, testID }: WeeklySummaryProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section} testID={testID}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        THIS WEEK
      </Text>
      <View style={styles.grid}>
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <View
              key={metric.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityLabel={`${metric.label}: ${metric.value}`}
            >
              <Icon size={18} color={colors.primary} strokeWidth={2} />
              <Text
                style={[styles.value, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {metric.value}
              </Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {metric.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 24,
      marginTop: 16,
      marginBottom: 8,
    },
    sectionLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.bold,
      letterSpacing: 0.8,
      marginBottom: 14,
      textTransform: 'uppercase',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    card: {
      flex: 1,
      minWidth: 110,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      alignItems: 'flex-start',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    value: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      marginTop: 12,
      marginBottom: 4,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      textTransform: 'uppercase',
    },
  })
