import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Logo } from './Logo'

interface AuthHeaderProps {
  onBack: () => void
  testID?: string
}

export function AuthHeader({ onBack, testID }: AuthHeaderProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          marginBottom: 16,
        },
        backButton: {
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: -8,
        },
        logoContainer: {
          flex: 1,
          alignItems: 'center',
          marginRight: 36,
        },
      }),
    []
  )

  return (
    <View style={styles.header} testID={testID}>
      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
      <View style={styles.logoContainer}>
        <Logo size={48} />
      </View>
    </View>
  )
}
