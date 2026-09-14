import React, { useEffect, useId } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface MiniGaugeProps {
  /** 0..100 */
  percent: number
  displayValue: string
  label: string
  color: string
  colorEnd?: string
  size?: number
  caption?: string
}

/**
 * Compact animated ring gauge for key ratios.
 * Presentation-only — caller supplies the percent and display strings.
 */
export function MiniGauge({
  percent,
  displayValue,
  label,
  color,
  colorEnd,
  size = 96,
  caption,
}: MiniGaugeProps) {
  const { colors } = useTheme()
  const rawId = useId()
  const gradientId = `mg${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  const strokeWidth = Math.max(8, Math.round(size * 0.11))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const clamped = Math.min(100, Math.max(0, percent))
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    })
  }, [clamped, progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  return (
    <View style={styles.container} accessibilityLabel={`${label}: ${displayValue}`}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color} />
              <Stop offset="1" stopColor={colorEnd ?? color} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text
            style={[styles.value, { color: colors.textHero, fontSize: size * 0.22 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayValue}
          </Text>
        </View>
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {caption ? (
        <Text style={[styles.caption, { color }]}>{caption}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.fontWeights.extraBold,
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    marginTop: 10,
    textAlign: 'center',
  },
  caption: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.fontWeights.semibold,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
})
