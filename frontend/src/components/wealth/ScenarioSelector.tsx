import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ScenarioKey } from '@/hooks/useWealthSimulator'
import type { ThemeColors } from '@/theme'

interface Scenario {
  key: ScenarioKey
  label: string
  rate: string
}

interface ScenarioSelectorProps {
  scenarios: Scenario[]
  activeKey: ScenarioKey
  onSelect: (key: ScenarioKey) => void
}

export function ScenarioSelector({
  scenarios,
  activeKey,
  onSelect,
}: ScenarioSelectorProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container}>
      {scenarios.map((scenario) => {
        const isActive = scenario.key === activeKey
        return (
          <Pressable
            key={scenario.key}
            style={[
              styles.card,
              isActive ? styles.activeCard : styles.inactiveCard,
            ]}
            onPress={() => onSelect(scenario.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.label,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {scenario.label}
            </Text>
            <Text
              style={[
                styles.rate,
                isActive ? styles.activeRate : styles.inactiveRate,
              ]}
            >
              {scenario.rate}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 12,
    },
    card: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      paddingVertical: 18,
      borderWidth: 2,
      backgroundColor: colors.surface,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    activeCard: {
      borderColor: colors.primary,
    },
    inactiveCard: {
      borderColor: colors.border,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      marginBottom: 4,
    },
    activeLabel: {
      color: colors.primary,
    },
    inactiveLabel: {
      color: colors.textSecondary,
    },
    rate: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
    },
    activeRate: {
      color: colors.primary,
    },
    inactiveRate: {
      color: colors.textSecondary,
    },
  })
}
