import React, { useEffect, useId } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

const AnimatedRect = Animated.createAnimatedComponent(Rect)

interface GradientBarProps {
  label: string
  value: string
  /** 0..1 fill fraction */
  progress: number
  color: string
  /** Optional second gradient stop for a two-tone hero bar */
  colorEnd?: string
  height?: number
}

/**
 * Animated horizontal bar with an SVG gradient fill.
 * Presentation-only — the caller supplies the formatted value and fraction.
 */
export function GradientBar({
  label,
  value,
  progress,
  color,
  colorEnd,
  height = 10,
}: GradientBarProps) {
  const { colors } = useTheme()
  const rawId = useId()
  const gradientId = `gb${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  const clamped = Math.min(1, Math.max(0, progress))
  const fill = useSharedValue(0)

  useEffect(() => {
    fill.value = withTiming(clamped, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    })
  }, [clamped, fill])

  const animatedProps = useAnimatedProps(() => ({
    width: Math.max(fill.value * 100, clamped > 0 ? 2 : 0),
  }))

  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        </View>
      ) : null}
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.55" />
            <Stop offset="1" stopColor={colorEnd ?? color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={100}
          height={height}
          rx={height / 2}
          fill={colors.border}
        />
        <AnimatedRect
          x={0}
          y={0}
          height={height}
          rx={height / 2}
          fill={`url(#${gradientId})`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.fontWeights.medium,
  },
  value: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.fontWeights.bold,
  },
})
