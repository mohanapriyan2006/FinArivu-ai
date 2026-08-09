import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface TrackerEmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  testID?: string
}

export function TrackerEmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  testID,
}: TrackerEmptyStateProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryBackground }]}>
        <Icon size={32} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onAction && actionLabel ? (
        <Pressable
          onPress={onAction}
          style={[styles.button, { backgroundColor: colors.primary }]}
          accessible
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 48,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: Typography.h3.fontSize,
      lineHeight: Typography.h3.lineHeight,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    button: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      fontWeight: '600',
    },
  })
