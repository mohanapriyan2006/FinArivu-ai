import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { ChevronRight } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface InsightCardProps {
  icon: LucideIcon
  title: string
  explanation: string
  metric?: string
  actionLabel?: string
  onPress?: () => void
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  testID?: string
}

export function InsightCard({
  icon: Icon,
  title,
  explanation,
  metric,
  actionLabel,
  onPress,
  variant = 'primary',
  testID,
}: InsightCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const { iconColor, iconBg, titleColor } = variantColors(colors, variant)

  return (
    <View
      style={styles.container}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Icon size={22} color={iconColor} strokeWidth={2} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          {metric ? (
            <Text style={[styles.metric, { color: colors.textPrimary }]}>{metric}</Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.explanation, { color: colors.textSecondary }]}>
        {explanation}
      </Text>
      {actionLabel ? (
        <Pressable
          onPress={onPress}
          style={styles.actionRow}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint={title}
        >
          <Text style={[styles.actionLabel, { color: colors.primary }]}>
            {actionLabel}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  )
}

function variantColors(
  colors: ThemeColors,
  variant: InsightCardProps['variant']
): { iconColor: string; iconBg: string; titleColor: string } {
  switch (variant) {
    case 'success':
      return { iconColor: colors.success, iconBg: colors.successBackground, titleColor: colors.success }
    case 'warning':
      return { iconColor: colors.warning, iconBg: colors.accentBackground, titleColor: colors.warning }
    case 'danger':
      return { iconColor: colors.danger, iconBg: colors.dangerBackground, titleColor: colors.danger }
    case 'primary':
    default:
      return { iconColor: colors.primary, iconBg: colors.primaryBackground, titleColor: colors.primary }
  }
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    text: {
      flex: 1,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h3,
      fontWeight: Typography.fontWeights.semibold,
      lineHeight: 22,
      marginBottom: 2,
    },
    metric: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
    },
    explanation: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      lineHeight: 22,
      marginBottom: 12,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      minHeight: 44,
    },
    actionLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
      marginRight: 4,
    },
  })
