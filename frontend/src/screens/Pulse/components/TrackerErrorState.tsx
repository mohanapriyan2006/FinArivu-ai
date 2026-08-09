import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface TrackerErrorStateProps {
  message: string
  onRetry: () => void
  testID?: string
}

export function TrackerErrorState({ message, onRetry, testID }: TrackerErrorStateProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.text}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={[styles.button, { backgroundColor: colors.primary }]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Retry"
      >
        <Text style={[styles.buttonText, { color: colors.surface }]}>Retry</Text>
      </Pressable>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 48,
    },
    text: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: 20,
    },
    button: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      fontWeight: '600',
    },
  })
