import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ScenarioMetric } from '@/types/scenarios'
import {
  directionArrow,
  directionTone,
  formatMetricChange,
  formatMetricValue,
} from './scenarioFormat'

interface Props {
  metric: ScenarioMetric
}

/** One baseline → scenario metric row with deterministic direction. */
export function ScenarioMetricRow({ metric }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const tone = directionTone(metric.direction)
  const changeText = formatMetricChange(metric)
  const changeColor =
    tone === 'improve'
      ? colors.success
      : tone === 'worsen'
        ? colors.danger
        : colors.textTertiary

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {metric.label}
      </Text>
      <View style={styles.values}>
        <Text style={styles.before}>
          {formatMetricValue(metric.before, metric.unit)}
        </Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.after}>
          {formatMetricValue(metric.after, metric.unit)}
        </Text>
        {changeText ? (
          <Text style={[styles.change, { color: changeColor }]}>
            {directionArrow(metric.direction)} {changeText}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      gap: 8,
    },
    label: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 12,
      flex: 1,
    },
    values: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    before: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 12,
    },
    arrow: {
      color: colors.textTertiary,
      fontSize: 11,
    },
    after: {
      ...Typography.labelSmall,
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 12,
    },
    change: {
      ...Typography.labelSmall,
      fontSize: 11,
      fontWeight: '600',
    },
  })
