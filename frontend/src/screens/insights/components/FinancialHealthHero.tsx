import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

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

const RADIUS = 80
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

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

  const progress = score === null ? 0 : Math.min(1, Math.max(0, score / 100))
  const offset = CIRCUMFERENCE * (1 - progress)

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
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={10}
            fill="none"
          />
          <Circle
            cx={100}
            cy={100}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.score, { color: colors.textHero }]}>
            {score === null ? '—' : score}
          </Text>
          <Text style={[styles.status, { color: ringColor }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.factors}>
        {factors.map((factor) => (
          <View key={factor.id} style={styles.factor}>
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
      width: 200,
      height: 200,
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
      gap: 12,
    },
    factor: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    factorName: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
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
