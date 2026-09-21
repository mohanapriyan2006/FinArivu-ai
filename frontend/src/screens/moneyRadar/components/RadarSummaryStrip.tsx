import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RadarSummary } from '@/types/moneyRadar'

interface Props {
  summary: RadarSummary
}

/** Compact metric strip — attention / opportunities / resolved. */
export function RadarSummaryStrip({ summary }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const items = [
    {
      label: 'Need attention',
      value: summary.attentionCount,
      color: summary.attentionCount > 0 ? colors.danger : colors.success,
    },
    {
      label: 'Opportunities',
      value: summary.opportunityCount,
      color: colors.primary,
    },
    {
      label: 'Resolved',
      value: summary.resolvedCount,
      color: colors.textTertiary,
    },
  ]

  return (
    <View style={styles.strip} testID="radar-summary-strip">
      {items.map((item) => (
        <View key={item.label} style={styles.cell}>
          <Text style={[styles.value, { color: item.color }]}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      marginBottom: 4,
    },
    cell: { flex: 1, alignItems: 'center' },
    value: {
      ...Typography.titleSmall,
      fontSize: 20,
      fontWeight: '800',
    },
    label: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 2,
    },
  })
