import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Bot, Sparkles } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { BaseColors, Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface AIRecommendationCardProps {
  onApply?: () => void
}

export function AIRecommendationCard({ onApply }: AIRecommendationCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Sparkles size={22} color={BaseColors.accent} strokeWidth={2.5} />
      </View>
      <Bot
        size={64}
        color={BaseColors.accent}
        strokeWidth={1}
        style={styles.watermark}
      />

      <Text style={styles.title}>AI Recommendation</Text>
      <Text style={styles.body}>
        If you save{' '}
        <Text style={styles.greenNumber}>₹10,000</Text>
        {' '}more monthly: Projected Net Worth{' '}
        <Text style={styles.blueNumber}>₹2.4 Crore</Text>
        {' '}extra by Age 50.
      </Text>

      <Pressable
        style={styles.button}
        onPress={onApply}
        accessibilityRole="button"
        accessibilityLabel="Apply AI strategy"
      >
        <Text style={styles.buttonText}>Apply Strategy</Text>
      </Pressable>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.aiInsightBackground,
      borderWidth: 1,
      borderColor: BaseColors.accent,
      borderRadius: 24,
      padding: 20,
      overflow: 'hidden',
      position: 'relative',
    },
    watermark: {
      position: 'absolute',
      top: 8,
      right: 8,
      opacity: 0.08,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: BaseColors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: BaseColors.accent,
      marginBottom: 8,
    },
    body: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textPrimary,
      lineHeight: 24,
      marginBottom: 20,
    },
    greenNumber: {
      color: BaseColors.success,
      fontWeight: Typography.fontWeights.bold,
    },
    blueNumber: {
      color: BaseColors.primary,
      fontWeight: Typography.fontWeights.bold,
    },
    button: {
      backgroundColor: colors.heroCard,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
    },
    buttonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
}
