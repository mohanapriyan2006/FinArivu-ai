import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Trend } from '../types'

interface TrendSectionProps {
  trends: Trend[]
  testID?: string
}

export function TrendSection({ trends, testID }: TrendSectionProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section} testID={testID}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        YOUR TRENDS
      </Text>
      {trends.map((trend) => (
        <View
          key={trend.id}
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel={`${trend.label} trend from ${trend.fromValue} to ${trend.toValue}`}
        >
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {trend.label}
          </Text>
          <View style={styles.values}>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {trend.fromValue}
            </Text>
            <Text style={[styles.arrow, { color: colors.textTertiary }]}>→</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {trend.toValue}
            </Text>
          </View>
          <View style={styles.delta}>
            {trend.isPositive ? (
              <ArrowUpRight size={14} color={colors.success} />
            ) : (
              <ArrowDownRight size={14} color={colors.danger} />
            )}
            <Text
              style={[
                styles.deltaText,
                { color: trend.isPositive ? colors.success : colors.danger },
              ]}
            >
              {trend.delta}
            </Text>
          </View>
        </View>
      ))}
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
      flex: 1,
      flexShrink: 1,
    },
    values: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
    },
    value: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
    },
    arrow: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      marginHorizontal: 6,
    },
    delta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deltaText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
      marginLeft: 4,
    },
  })
