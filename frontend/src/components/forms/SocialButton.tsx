import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Apple, LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import { GoogleIcon } from './GoogleIcon'

interface SocialButtonProps {
  provider: 'google' | 'apple'
  onPress: () => void
  testID?: string
}

export function SocialButton({ provider, onPress, testID }: SocialButtonProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          height: 52,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        },
        text: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.medium,
          color: colors.textPrimary,
        },
      }),
    [colors.border, colors.surface, colors.textPrimary]
  )

  const title = provider === 'google' ? 'Google' : 'Apple'

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${title}`}
      testID={testID}
    >
      {provider === 'google' ? (
        <GoogleIcon size={20} />
      ) : (
        <Apple size={20} color={colors.socialApple} strokeWidth={2} />
      )}
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  )
}
