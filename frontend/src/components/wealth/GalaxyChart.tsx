import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Wallet } from 'lucide-react-native'
import Svg, { Circle } from 'react-native-svg'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import { AnimatedNumber } from './AnimatedNumber'
import type { ThemeColors } from '@/theme'

interface GalaxyChartProps {
  value: number
  trendLabel: string
}

const CHART_SIZE = 280
const CENTER = CHART_SIZE / 2

const RINGS = [
  { radius: 72, dash: [4, 6] },
  { radius: 108, dash: [6, 10] },
  { radius: 132, dash: [8, 12] },
]

export function GalaxyChart({ value, trendLabel }: GalaxyChartProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container}>
      <View style={styles.floatingData}>
        <Text style={styles.floatingLabel}>PROJECTED NET WORTH</Text>
        <AnimatedNumber value={value} style={styles.floatingValue} />
        <View style={styles.trendPill}>
          <Text style={styles.trendPillText}>{trendLabel}</Text>
        </View>
      </View>

      <Svg width={CHART_SIZE} height={CHART_SIZE} style={styles.svg}>
        {RINGS.map((ring, index) => (
          <Circle
            key={index}
            cx={CENTER}
            cy={CENTER}
            r={ring.radius}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray={ring.dash}
            fill="none"
            opacity={0.6}
          />
        ))}
      </Svg>

      <View style={styles.anchor}>
        <View style={styles.anchorIconBox}>
          <Wallet size={28} color={colors.surface} strokeWidth={2} />
        </View>
      </View>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      height: CHART_SIZE + 80,
      marginVertical: 24,
    },
    svg: {
      position: 'absolute',
    },
    anchor: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    anchorIconBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.heroCard,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
    floatingData: {
      alignItems: 'center',
      marginBottom: 12,
      zIndex: 2,
    },
    floatingLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xxs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    floatingValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['4xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
      marginBottom: 8,
    },
    trendPill: {
      backgroundColor: colors.successBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    trendPillText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.success,
    },
  })
}
