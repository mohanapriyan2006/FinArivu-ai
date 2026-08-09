import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography, BaseColors } from '@/theme'
import type { ThemeColors } from '@/theme'

interface InsightsEmptyStateProps {
  onCompleteProfile: () => void
  onAddExpense: () => void
  testID?: string
}

export function InsightsEmptyState({
  onCompleteProfile,
  onAddExpense,
  testID,
}: InsightsEmptyStateProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.title, { color: colors.textHero }]}>
        Your financial insights will appear here
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Add a few financial details to start seeing meaningful trends.
      </Text>

      <Pressable
        onPress={onCompleteProfile}
        style={[styles.button, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Complete Financial Profile"
      >
        <Text style={[styles.buttonText, { color: BaseColors.surfaceLight }]}>
          Complete Financial Profile
        </Text>
      </Pressable>

      <Pressable
        onPress={onAddExpense}
        style={[styles.ghost, { borderColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Add Expense"
      >
        <Text style={[styles.ghostText, { color: colors.primary }]}>
          Add Expense
        </Text>
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
      fontSize: Typography.sizes.h2,
      fontWeight: Typography.fontWeights.bold,
      textAlign: 'center',
      marginBottom: 12,
    },
    body: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 28,
    },
    button: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    buttonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
    ghost: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
  })
