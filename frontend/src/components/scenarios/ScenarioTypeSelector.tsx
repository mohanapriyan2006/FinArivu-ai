import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ScenarioTypeInfo } from '@/types/scenarios'

interface Props {
  types: ScenarioTypeInfo[]
  selected: string | null
  onSelect: (type: string) => void
}

/** Horizontal chips for choosing a scenario type. */
export function ScenarioTypeSelector({ types, selected, onSelect }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {types.map((t) => {
        const active = t.type === selected
        return (
          <Pressable
            key={t.type}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(t.type)}
            accessibilityRole="button"
            accessibilityLabel={t.label}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 4,
      paddingRight: 16,
    },
    chip: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    chipActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    chipText: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    chipTextActive: {
      color: colors.primary,
    },
  })
