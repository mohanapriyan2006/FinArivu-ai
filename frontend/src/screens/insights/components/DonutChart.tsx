import React, { useEffect, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export interface DonutSegment {
  label: string
  value: number
  color: string
  /** Pre-formatted display string, e.g. "₹5,000" or "32%" */
  displayValue?: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
  centerValue?: string
  centerLabel?: string
}

/**
 * Animated donut chart with a legend. Presentation-only — callers pass
 * absolute values; fractions are derived here for layout only.
 */
export function DonutChart({
  segments,
  size = 180,
  strokeWidth = 22,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const { colors } = useTheme()

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const gap = segments.length > 1 ? 3 : 0

  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0)

  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    })
  }, [progress])

  const animatedProps = useAnimatedProps(() => ({
    opacity: progress.value,
  }))

  const layout = useMemo(() => {
    let acc = 0
    return segments.map((segment) => {
      const fraction = total > 0 ? Math.max(0, segment.value) / total : 0
      const length = fraction * circumference
      const offset = acc
      acc += length
      return { segment, fraction, length, offset }
    })
  }, [segments, total, circumference])

  return (
    <View style={styles.container}>
      <View style={[styles.chartWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {layout.map(({ segment, length, offset }) => (
            <AnimatedCircle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${Math.max(0, length - gap)} ${circumference - length + gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
              animatedProps={animatedProps}
            />
          ))}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          {centerValue ? (
            <Text
              style={[styles.centerValue, { color: colors.textHero }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {centerValue}
            </Text>
          ) : null}
          {centerLabel ? (
            <Text style={[styles.centerLabel, { color: colors.textSecondary }]}>
              {centerLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.legend}>
        {layout.map(({ segment, fraction }) => (
          <View key={segment.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <Text
              style={[styles.legendLabel, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
              {segment.displayValue ?? `${Math.round(fraction * 100)}%`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerValue: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.extraBold,
  },
  centerLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.medium,
    marginTop: 2,
    textAlign: 'center',
  },
  legend: {
    alignSelf: 'stretch',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.fontWeights.medium,
    flex: 1,
    textTransform: 'capitalize',
  },
  legendValue: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.fontWeights.semibold,
  },
})
