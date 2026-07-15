import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface AuthFooterProps {
  testID?: string
}

export function AuthFooter({ testID }: AuthFooterProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: 24,
          alignItems: 'center',
          gap: 8,
        },
        links: {
          flexDirection: 'row',
          gap: 16,
        },
        linkPressable: {
          minHeight: 44,
          justifyContent: 'center',
        },
        link: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.medium,
          color: colors.textTertiary,
        },
        copyright: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textTertiary,
        },
      }),
    [colors.textTertiary]
  )

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.links}>
        <Pressable style={styles.linkPressable} accessibilityRole="link">
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>
        <Pressable style={styles.linkPressable} accessibilityRole="link">
          <Text style={styles.link}>Terms of Service</Text>
        </Pressable>
        <Pressable style={styles.linkPressable} accessibilityRole="link">
          <Text style={styles.link}>Security Disclosure</Text>
        </Pressable>
      </View>
      <Text style={styles.copyright}>© 2024 FinArivu AI. Secure & Encrypted.</Text>
    </View>
  )
}
