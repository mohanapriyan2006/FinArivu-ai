import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface ProfileStatCardProps {
  title: string
  value: string
  status?: string
  statusColor?: string
  icon: LucideIcon
  iconBackgroundColor?: string
  iconColor?: string
  onPress?: () => void
}

export function ProfileStatCard({
  title,
  value,
  status,
  statusColor,
  icon: Icon,
  iconBackgroundColor,
  iconColor,
  onPress,
}: ProfileStatCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const effectiveIconBg = iconBackgroundColor ?? colors.primaryBackground
  const effectiveIconColor = iconColor ?? colors.primary
  const effectiveStatusColor = statusColor ?? colors.success

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressedCard,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: effectiveIconBg }]}>
          <Icon size={20} color={effectiveIconColor} strokeWidth={2.2} />
        </View>
        {status ? (
          <View style={[styles.statusBadge, { backgroundColor: effectiveStatusColor + '18' }]}>
            <Text style={[styles.statusText, { color: effectiveStatusColor }]}>{status}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
    </Pressable>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 100,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    pressedCard: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    headerRow: {
      flexDirection: 'column',
      gap: 4,
      alignItems: 'center',
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontWeight: Typography.fontWeights.semibold,
    },
    body: {
      gap: 2,
    },
    value: {
      fontFamily: Typography.fontFamily,
      fontSize: 20,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
  })
}
