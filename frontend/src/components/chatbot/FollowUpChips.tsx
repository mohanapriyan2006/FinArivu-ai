import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ChatFollowUp } from '@/types/copilot'

interface FollowUpChipsProps {
  onSelect: (chipText: string) => void
  suggestions?: string[] | ChatFollowUp[]
}

export function FollowUpChips({ onSelect, suggestions }: FollowUpChipsProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const items = suggestions && suggestions.length > 0
    ? suggestions.map((s, i) => ({
        id: `sug-${i}`,
        label: typeof s === 'string' ? s : (s.label || ''),
        icon: Sparkles,
      }))
    : []

  if (items.length === 0) return null

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const IconComp = item.icon
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.chip,
                pressed && styles.chipPressed,
              ]}
              onPress={() => onSelect(item.label)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <IconComp size={13} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.chipText}>{item.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
      marginBottom: 6,
    },
    scrollContent: {
      paddingHorizontal: 4,
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 7,
      gap: 6,
    },
    chipPressed: {
      opacity: 0.75,
      backgroundColor: colors.primary,
    },
    chipText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontWeight: '600',
      fontSize: 12,
    },
  })
