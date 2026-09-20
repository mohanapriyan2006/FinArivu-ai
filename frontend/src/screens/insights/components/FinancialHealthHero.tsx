import React, { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { HealthFactor } from '../types'

interface FinancialHealthHeroProps {
  score: number | null
  status: string
  factors: HealthFactor[]
  explanation: string
  onPress?: () => void
}

const SIZE = 210
const CENTER = SIZE / 2
const RADIUS = 84
const STROKE = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase()
}

export function FinancialHealthHero({
  score,
  status,
  factors,
  explanation,
  onPress,
}: FinancialHealthHeroProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const ringColor = useMemo(() => {
    if (score === null) return colors.textSecondary
    if (score >= 75) return colors.success
    if (score >= 50) return colors.warning
    return colors.danger
  }, [colors, score])

  const ringColorEnd = useMemo(() => {
    if (score === null) return colors.textSecondary
    if (score >= 75) return colors.secondary
    if (score >= 50) return colors.danger
    return colors.warning
  }, [colors, score])

  const target = score === null ? 0 : Math.min(1, Math.max(0, score / 100))
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(target, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    })
  }, [target, progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }))

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="Financial Health"
      accessibilityHint="View financial health details"
    >
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        FINANCIAL HEALTH
      </Text>

      <View style={styles.gaugeContainer}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Defs>
            <LinearGradient id="healthRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={ringColor} />
              <Stop offset="1" stopColor={ringColorEnd} />
            </LinearGradient>
          </Defs>
          {/* soft glow behind the progress arc */}
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={STROKE + 10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            opacity={0.15}
          />
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke="url(#healthRing)"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.score, { color: colors.textHero }]}>
            {score === null ? '—' : score}
          </Text>
          <Text style={[styles.status, { color: ringColor }]}>
            {humanizeStatus(status)}
          </Text>
        </View>
      </View>

      <View style={styles.factors}>
        {factors.map((factor) => (
          <View
            key={factor.id}
            style={[
              styles.factorChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: dotColor(colors, factor.status) },
              ]}
            />
            <Text style={[styles.factorName, { color: colors.textPrimary }]}>
              {factor.name}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.explanation, { color: colors.textSecondary }]}>
        {explanation}
      </Text>
    </Pressable>
  )
}

function dotColor(
  colors: ThemeColors,
  status: HealthFactor['status']
): string {
  switch (status) {
    case 'strong':
      return colors.success
    case 'fair':
      return colors.warning
    case 'weak':
      return colors.danger
    case 'unknown':
    default:
      return colors.textTertiary
  }
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 8,
    },
    sectionLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.bold,
      letterSpacing: 0.8,
      marginBottom: 20,
      textTransform: 'uppercase',
    },
    gaugeContainer: {
      width: SIZE,
      height: SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    gaugeCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    score: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.score,
      fontWeight: Typography.fontWeights.extraBold,
      lineHeight: 58,
    },
    status: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      textTransform: 'capitalize',
    },
    factors: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 16,
      gap: 8,
    },
    factorChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    factorName: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
    },
    explanation: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      lineHeight: 22,
      textAlign: 'center',
      maxWidth: 280,
    },
  })
