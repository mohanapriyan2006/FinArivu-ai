import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface BreakdownRowProps {
  label: string
  score: string
  colorKey: 'primary' | 'warning' | 'success'
}

export function BreakdownRow({ label, score, colorKey }: BreakdownRowProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [current, total] = score.split('/').map((n) => Number(n.trim()) || 0)
  const progress = Math.min(current / (total || 1), 1)

  const fillStyle =
    colorKey === 'primary'
      ? styles.fillPrimary
      : colorKey === 'warning'
        ? styles.fillWarning
        : styles.fillSuccess

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, fillStyle, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      marginBottom: 16,
    },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    score: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
    },
    track: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 4,
    },
    fillPrimary: {
      backgroundColor: colors.primary,
    },
    fillWarning: {
      backgroundColor: colors.warning,
    },
    fillSuccess: {
      backgroundColor: colors.success,
    },
  })
