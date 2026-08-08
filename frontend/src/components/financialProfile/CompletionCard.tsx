import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { X } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { PrimaryButton } from '@/components/forms'
import { ProfileProgressBar } from './ProfileProgressBar'
import { Typography } from '@/theme'

interface CompletionCardProps {
  percentage: number
  onContinue: () => void
  onDismiss: () => void
  testID?: string
}

export function CompletionCard({
  percentage,
  onContinue,
  onDismiss,
  testID,
}: CompletionCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 20,
          marginHorizontal: 20,
          marginTop: 16,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.lg,
          fontWeight: Typography.fontWeights.bold,
          color: colors.textPrimary,
        },
        dismiss: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        },
        percent: {
          fontFamily: Typography.fontFamily,
          fontSize: 26,
          fontWeight: Typography.fontWeights.extraBold,
          color: colors.primary,
          marginTop: 8,
        },
        progress: {
          marginTop: 10,
          marginBottom: 12,
        },
        body: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: 20,
        },
      }),
    [colors]
  )

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete your financial profile</Text>
        <Pressable
          onPress={onDismiss}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss completion reminder"
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <X size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>
      <Text style={styles.percent}>{percentage}% complete</Text>
      <View style={styles.progress}>
        <ProfileProgressBar percentage={percentage} />
      </View>
      <Text style={styles.body}>
        Add a few more details to improve your Personal CFO insights.
      </Text>
      <PrimaryButton
        title="Continue Setup"
        onPress={onContinue}
        testID={testID ? `${testID}-continue` : undefined}
      />
    </View>
  )
}
