import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Lock } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface SecurityBadgeProps {
  text: string
  testID?: string
}

export function SecurityBadge({ text, testID }: SecurityBadgeProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 16,
          backgroundColor: colors.successBackground,
          alignSelf: 'center',
        },
        text: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.medium,
          color: colors.success,
          flexShrink: 1,
        },
      }),
    [colors.success, colors.successBackground]
  )

  return (
    <View style={styles.pill} testID={testID}>
      <Lock size={18} color={colors.success} strokeWidth={2} />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}
