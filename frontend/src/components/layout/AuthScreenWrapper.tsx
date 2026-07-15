import { useMemo } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/ThemeContext'

interface AuthScreenWrapperProps {
  children: React.ReactNode
  testID?: string
}

export function AuthScreenWrapper({ children, testID }: AuthScreenWrapperProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        background: {
          flex: 1,
          backgroundColor: colors.background,
        },
        keyboardView: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 24),
        },
        container: {
          flex: 1,
          paddingHorizontal: 24,
        },
      }),
    [colors.background, insets.bottom, insets.top]
  )

  return (
    <View testID={testID} style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
