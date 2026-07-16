import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface ProgressRingProps {
  size?: number
  strokeWidth?: number
  progress: number
  value: string
  status: string
}

export function ProgressRing({
  size = 160,
  strokeWidth = 14,
  progress,
  value,
  status,
}: ProgressRingProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.success}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={styles.textOverlay}>
        <Text style={styles.scoreText}>{value}</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    svg: {
      position: 'absolute',
    },
    textOverlay: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['3xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    statusText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  })
