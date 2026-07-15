import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface DividerTextProps {
  text: string
  testID?: string
}

export function DividerText({ text, testID }: DividerTextProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        },
        line: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },
        text: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.medium,
          color: colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }),
    [colors.border, colors.textTertiary]
  )

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  )
}
