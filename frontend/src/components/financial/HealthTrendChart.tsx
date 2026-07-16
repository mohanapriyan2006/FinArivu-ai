import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface Point {
  x: number
  y: number
}

interface HealthTrendChartProps {
  width: number
  height?: number
}

const LABELS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov']
const SCORE_DATA = [68, 72, 76, 80, 84]
const NET_WORTH_DATA = [8, 12, 16, 22, 28]

function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

function getChartPoints(
  data: number[],
  chartWidth: number,
  chartHeight: number,
  padding = 12
): Point[] {
  const min = Math.min(...data) * 0.8
  const max = Math.max(...data) * 1.1
  const range = max - min || 1
  return data.map((value, index) => ({
    x: padding + (index / (data.length - 1)) * (chartWidth - 2 * padding),
    y: chartHeight - padding - ((value - min) / range) * (chartHeight - 2 * padding),
  }))
}

export function HealthTrendChart({ width, height = 140 }: HealthTrendChartProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [tab, setTab] = useState<'score' | 'netWorth'>('score')

  const data = tab === 'score' ? SCORE_DATA : NET_WORTH_DATA
  const points = useMemo(
    () => getChartPoints(data, width, height, 12),
    [data, width, height]
  )
  const line = useMemo(() => buildSmoothPath(points), [points])
  const area = useMemo(
    () =>
      `${line} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`,
    [line, points, height]
  )

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, tab === 'score' && styles.toggleButtonActive]}
          onPress={() => setTab('score')}
        >
          <Text
            style={[styles.toggleText, tab === 'score' && styles.toggleTextActive]}
          >
            Score
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, tab === 'netWorth' && styles.toggleButtonActive]}
          onPress={() => setTab('netWorth')}
        >
          <Text
            style={[styles.toggleText, tab === 'netWorth' && styles.toggleTextActive]}
          >
            Net Worth
          </Text>
        </Pressable>
      </View>

      <View style={[styles.chartWrapper, { width, height }]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0.25" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#trendGradient)" />
          <Path
            d={line}
            stroke={colors.primary}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <View style={[styles.labelsRow, { width }]}>
        {LABELS.map((label) => (
          <Text key={label} style={styles.label}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: 4,
    },
    toggleButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    toggleTextActive: {
      color: colors.surface,
      fontWeight: Typography.fontWeights.semibold,
    },
    chartWrapper: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 12,
    },
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      color: colors.textSecondary,
      textAlign: 'center',
      flex: 1,
    },
  })
