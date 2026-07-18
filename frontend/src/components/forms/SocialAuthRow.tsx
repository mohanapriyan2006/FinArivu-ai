import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { SocialButton } from './SocialButton'
import { DividerText } from './DividerText'

interface SocialAuthRowProps {
  onSocialPress: (provider: 'google' | 'apple') => void
  testID?: string
}

export function SocialAuthRow({ onSocialPress, testID }: SocialAuthRowProps) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        dividerSpacing: {
          marginTop: 24,
          marginBottom: 24,
        },
        socialRow: {
          flexDirection: 'row',
          gap: 12,
        },
        socialButton: {
          flex: 1,
        },
      }),
    []
  )

  return (
    <View testID={testID}>
      <View style={styles.dividerSpacing}>
        <DividerText text="or" />
      </View>
      <View style={styles.socialRow}>
        <View style={styles.socialButton}>
          <SocialButton provider="google" onPress={() => onSocialPress('google')} />
        </View>
      </View>
    </View>
  )
}
