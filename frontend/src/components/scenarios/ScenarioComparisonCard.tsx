import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Columns2 } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ScenarioCompareResult } from '@/types/scenarios'
import {
  directionTone,
  formatMetricChange,
  formatMetricValue,
} from './scenarioFormat'

interface Props {
  comparison: ScenarioCompareResult
}

/** Side-by-side comparison of scenario runs on aligned metric rows. */
export function ScenarioComparisonCard({ comparison }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Columns2 size={15} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.title}>Comparison</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.row}>
            <Text style={[styles.cellLabel, styles.headerCell]} />
            {comparison.titles.map((t, i) => (
              <Text key={`t-${i}`} style={[styles.cell, styles.headerCell]}>
                {t}
              </Text>
            ))}
          </View>
          {comparison.rows.map((row) => (
            <View key={row.key} style={styles.row}>
              <Text style={styles.cellLabel} numberOfLines={2}>
                {row.label}
              </Text>
              {row.cells.map((cell, i) => {
                const tone = directionTone(cell.direction)
                const color =
                  tone === 'improve'
                    ? colors.success
                    : tone === 'worsen'
                      ? colors.danger
                      : colors.textPrimary
                const change = formatMetricChange({
                  key: row.key,
                  label: row.label,
                  before: row.before,
                  after: cell.after,
                  change: cell.change,
                  unit: row.unit,
                  direction: cell.direction,
                })
                return (
                  <View key={`c-${i}`} style={styles.cellWrap}>
                    <Text style={styles.cell}>
                      {formatMetricValue(cell.after, row.unit)}
                    </Text>
                    {change ? (
                      <Text style={[styles.change, { color }]}>{change}</Text>
                    ) : null}
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const CELL_WIDTH = 108

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginTop: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    title: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 13,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 6,
      gap: 8,
    },
    cellLabel: {
      width: 110,
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
    },
    cell: {
      width: CELL_WIDTH,
      ...Typography.labelSmall,
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    cellWrap: { width: CELL_WIDTH },
    headerCell: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    change: {
      ...Typography.labelSmall,
      fontSize: 10,
      marginTop: 1,
    },
  })
