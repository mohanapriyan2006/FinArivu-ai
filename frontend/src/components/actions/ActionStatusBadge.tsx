import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ActionExecutionStatus } from '@/types/actions'
import { statusLabel, statusTone, type StatusTone } from './actionFormat'

function toneColors(colors: ThemeColors, tone: StatusTone) {
  switch (tone) {
    case 'success':
      return { bg: colors.successBackground, fg: colors.success }
    case 'warning':
      return { bg: colors.primarySoft, fg: colors.warning }
    case 'danger':
      return { bg: colors.dangerBackground, fg: colors.danger }
    case 'info':
      return { bg: colors.primarySoft, fg: colors.primary }
    default:
      return { bg: colors.border, fg: colors.textSecondary }
  }
}

interface Props {
  status: ActionExecutionStatus | string
}

export function ActionStatusBadge({ status }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const tone = toneColors(colors, statusTone(status))
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{statusLabel(status)}</Text>
    </View>
  )
}

const makeStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: 'flex-start',
    },
    text: {
      ...Typography.labelSmall,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
  })
