import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface AuthPromptProps {
  message: string
  action: string
  onPress: () => void
  testID?: string
}

export function AuthPrompt({ message, action, onPress, testID }: AuthPromptProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        footer: {
          marginTop: 24,
          alignItems: 'center',
          minHeight: 44,
          justifyContent: 'center',
        },
        footerText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
        },
        footerLink: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.primary,
        },
      }),
    [colors.primary, colors.textSecondary]
  )

  return (
    <View style={styles.footer} testID={testID}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <Text style={styles.footerText}>
          {message}{' '}
          <Text style={styles.footerLink}>{action}</Text>
        </Text>
      </Pressable>
    </View>
  )
}
