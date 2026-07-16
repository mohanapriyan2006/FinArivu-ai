import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface ProfileStatCardProps {
  title: string
  value: string
  status: string
  statusColor: string
  borderColor: string
  icon: LucideIcon
  iconBackgroundColor: string
  iconColor: string
}

export function ProfileStatCard({
  title,
  value,
  status,
  statusColor,
  borderColor,
  icon: Icon,
  iconBackgroundColor,
  iconColor,
}: ProfileStatCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.card}>
      <View style={[styles.leftBorder, { backgroundColor: borderColor }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
      <View style={[styles.iconBox, { backgroundColor: iconBackgroundColor }]}>
        <Icon size={22} color={iconColor} strokeWidth={2} />
      </View>
    </View>
  )
}

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      ...CARD_SHADOW,
    },
    leftBorder: {
      width: 4,
      alignSelf: 'stretch',
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      marginRight: 16,
      marginLeft: -16,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingLeft: 0,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    value: {
      fontFamily: Typography.fontFamily,
      fontSize: 24,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    status: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.semibold,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
