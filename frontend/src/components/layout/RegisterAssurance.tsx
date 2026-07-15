import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ShieldCheck } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

export function RegisterAssurance({ testID }: { testID?: string }) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        assurance: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 24,
        },
        assuranceText: {
          flex: 1,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textTertiary,
          textAlign: 'center',
        },
      }),
    [colors.textTertiary]
  )

  return (
    <View style={styles.assurance} testID={testID}>
      <ShieldCheck size={16} color={colors.textTertiary} strokeWidth={2} />
      <Text style={styles.assuranceText}>
        Your data is never sold. Your financial information remains private and
        secure.
      </Text>
    </View>
  )
}
