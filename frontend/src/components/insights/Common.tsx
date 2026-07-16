import React, { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { Bell, User, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

export const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 3,
}

interface ScreenHeaderProps {
  title: string
  onBellPress?: () => void
}

export function ScreenHeader({ title, onBellPress }: ScreenHeaderProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.headerRow}>
      <View style={styles.avatar}>
        <User size={20} color={colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Pressable
        style={styles.bellButton}
        onPress={onBellPress}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Bell size={22} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

interface ProgressBarProps {
  progress: number
  fillColor?: string
  trackColor?: string
  height?: number
  delay?: number
}

export function ProgressBar({
  progress,
  fillColor,
  trackColor,
  height = 8,
  delay = 0,
}: ProgressBarProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withDelay(
      delay,
      withSpring(progress * 100, { damping: 20, stiffness: 120 })
    )
  }, [progress, delay, width])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }))

  return (
    <View
      style={[
        styles.progressTrack,
        { height, backgroundColor: trackColor ?? colors.border },
      ]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: fillColor ?? colors.primary },
          animatedStyle,
        ]}
      />
    </View>
  )
}

interface PillBadgeProps {
  label: string
  backgroundColor: string
  textColor: string
}

export function PillBadge({ label, backgroundColor, textColor }: PillBadgeProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
    </View>
  )
}

interface IconBadgeProps {
  icon: LucideIcon
  color: string
  backgroundColor: string
  size?: number
}

export function IconBadge({ icon: Icon, color, backgroundColor, size = 20 }: IconBadgeProps) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </View>
  )
}

interface MiniCardProps {
  topLabel: string
  value: string
  status?: string
  statusColor?: string
  icon?: LucideIcon
  iconBackgroundColor?: string
  iconColor?: string
}

export function MiniCard({
  topLabel,
  value,
  status,
  statusColor,
  icon,
  iconBackgroundColor,
  iconColor,
}: MiniCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.miniCard}>
      <View style={styles.miniCardTop}>
        {icon && iconBackgroundColor && (
          <IconBadge
            icon={icon}
            color={iconColor ?? colors.primary}
            backgroundColor={iconBackgroundColor}
            size={18}
          />
        )}
        <Text style={styles.miniCardLabel}>{topLabel}</Text>
      </View>
      <Text style={[styles.miniCardValue, { color: statusColor ?? colors.textPrimary }]}>
        {value}
      </Text>
      {status && statusColor && (
        <View style={styles.miniCardStatus}>
          <View style={[styles.miniCardDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.miniCardStatusText, { color: statusColor }]}>{status}</Text>
        </View>
      )}
    </View>
  )
}

interface ListRowProps {
  icon: LucideIcon
  iconBackgroundColor: string
  iconColor: string
  title: string
  subtitle: string
  trailing: string
  trailingColor?: string
}

export function ListRow({
  icon,
  iconBackgroundColor,
  iconColor,
  title,
  subtitle,
  trailing,
  trailingColor,
}: ListRowProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.listRow}>
      <IconBadge icon={icon} color={iconColor} backgroundColor={iconBackgroundColor} size={20} />
      <View style={styles.listRowText}>
        <Text style={styles.listRowTitle}>{title}</Text>
        <Text style={styles.listRowSubtitle}>{subtitle}</Text>
      </View>
      <Text style={[styles.listRowTrailing, { color: trailingColor ?? colors.textPrimary }]}>
        {trailing}
      </Text>
    </View>
  )
}

interface SectionHeaderProps {
  title: string
  actionText?: string
  onAction?: () => void
}

export function SectionHeader({ title, actionText, onAction }: SectionHeaderProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionText && (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={styles.sectionAction}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    bellButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pillText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      minWidth: 110,
      ...CARD_SHADOW,
    },
    miniCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    miniCardLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    miniCardValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      marginBottom: 8,
    },
    miniCardStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    miniCardDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    miniCardStatusText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      ...CARD_SHADOW,
    },
    listRowText: {
      flex: 1,
    },
    listRowTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    listRowSubtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
    listRowTrailing: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    sectionAction: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
  })
}
