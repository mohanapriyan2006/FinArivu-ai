import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AlertCircle } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface AuthErrorBannerProps {
  message: string | null
  testID?: string
}

export function AuthErrorBanner({ message, testID }: AuthErrorBannerProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.dangerTint,
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 16,
        },
        text: {
          flex: 1,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.medium,
          color: colors.danger,
          lineHeight: 18,
        },
      }),
    [colors.danger, colors.dangerTint]
  )

  if (!message) return null

  return (
    <View
      style={styles.banner}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <AlertCircle size={18} color={colors.danger} strokeWidth={2} />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}
