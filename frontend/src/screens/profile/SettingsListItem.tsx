import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
}

interface SettingsListItemProps {
  icon: LucideIcon
  title: string
  subtitle: string
  onPress?: () => void
}

export function SettingsListItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: SettingsListItemProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
    >
      <View style={styles.iconBox}>
        <Icon size={20} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
    </Pressable>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      ...CARD_SHADOW,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    text: {
      flex: 1,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
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
