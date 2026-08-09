import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography, BaseColors } from '@/theme'
import type { ThemeColors } from '@/theme'

interface InsightsErrorStateProps {
  message?: string
  onRetry: () => void
  testID?: string
}

export function InsightsErrorState({
  message = "Couldn't load your latest insights.",
  onRetry,
  testID,
}: InsightsErrorStateProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.title, { color: colors.danger }]}>
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        style={[styles.button, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Retry"
      >
        <Text style={[styles.buttonText, { color: BaseColors.surfaceLight }]}>Retry</Text>
      </Pressable>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 24,
      paddingTop: 40,
      alignItems: 'center',
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h3,
      fontWeight: Typography.fontWeights.semibold,
      textAlign: 'center',
      marginBottom: 20,
    },
    button: {
      height: 44,
      paddingHorizontal: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 120,
    },
    buttonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
  })
