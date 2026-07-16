import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, type LucideIcon } from 'lucide-react-native'

import { ProgressBar } from '@/components/insights/Common'
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

export interface NotificationItemProps {
  variant?: 'standard' | 'ai' | 'progress'
  icon: LucideIcon
  iconBackgroundColor: string
  iconColor: string
  title: string
  timestamp: string
  unread?: boolean
  actionText?: string
  onAction?: () => void
  progress?: number
  progressColor?: string
  aiButtonText?: string
  onAiButtonPress?: () => void
  children: React.ReactNode
}

export function NotificationItem({
  variant = 'standard',
  icon: Icon,
  iconBackgroundColor,
  iconColor,
  title,
  timestamp,
  unread,
  actionText,
  onAction,
  progress,
  progressColor,
  aiButtonText,
  onAiButtonPress,
  children,
}: NotificationItemProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const isAi = variant === 'ai'

  return (
    <View style={[styles.card, isAi && styles.aiCard]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: iconBackgroundColor }]}>
          <Icon size={24} color={iconColor} strokeWidth={2} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body} numberOfLines={0}>
            {children}
          </Text>

          {actionText ? (
            <Pressable onPress={onAction} style={styles.actionRow} accessibilityRole="button">
              <Text style={styles.actionText}>{actionText}</Text>
              <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
            </Pressable>
          ) : null}

          {variant === 'progress' && typeof progress === 'number' ? (
            <View style={styles.progressFooter}>
              <ProgressBar
                progress={progress}
                fillColor={progressColor ?? colors.warning}
                trackColor={colors.border}
                height={8}
              />
            </View>
          ) : null}

          {isAi && aiButtonText ? (
            <Pressable
              onPress={onAiButtonPress}
              style={styles.aiButton}
              accessibilityRole="button"
            >
              <Text style={styles.aiButtonText}>{aiButtonText}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.meta}>
        {unread ? <View style={styles.unreadDot} /> : null}
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      ...CARD_SHADOW,
    },
    aiCard: {
      backgroundColor: colors.aiInsightBackground,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginRight: 70,
    },
    body: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 18,
      marginTop: 4,
    },
    meta: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    timestamp: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textTertiary,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 2,
      alignSelf: 'flex-start',
    },
    actionText: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    progressFooter: {
      marginTop: 12,
    },
    aiButton: {
      marginTop: 12,
      backgroundColor: colors.accentDark,
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: 'center',
    },
    aiButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
}
