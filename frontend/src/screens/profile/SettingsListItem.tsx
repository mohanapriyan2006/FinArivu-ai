import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface SettingsListItemProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  onPress?: () => void
  rightElement?: React.ReactNode
  destructive?: boolean
  showChevron?: boolean
  iconColor?: string
  iconBackgroundColor?: string
}

export function SettingsListItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  rightElement,
  destructive = false,
  showChevron = true,
  iconColor,
  iconBackgroundColor,
}: SettingsListItemProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors, destructive)

  const effectiveIconBg = iconBackgroundColor ?? (destructive ? colors.dangerBackground : colors.primaryBackground)
  const effectiveIconColor = iconColor ?? (destructive ? colors.danger : colors.primary)

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={({ pressed }) => [
        styles.container,
        pressed && onPress && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.iconBox, { backgroundColor: effectiveIconBg }]}>
        <Icon size={20} color={effectiveIconColor} strokeWidth={2} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {rightElement ? (
        rightElement
      ) : showChevron && onPress ? (
        <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />
      ) : null}
    </Pressable>
  )
}

function makeStyles(colors: ThemeColors, destructive: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
      minHeight: 64,
    },
    pressed: {
      opacity: 0.85,
      backgroundColor: colors.background,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingRight: 8,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.semibold,
      color: destructive ? colors.danger : colors.textPrimary,
      marginBottom: 2,
    },
    subtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
  })
}
