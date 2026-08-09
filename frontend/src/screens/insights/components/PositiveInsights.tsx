import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PositiveItem } from '../types'

interface PositiveInsightsProps {
  items: PositiveItem[]
  testID?: string
}

export function PositiveInsights({ items, testID }: PositiveInsightsProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section} testID={testID}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        WHAT'S GOING WELL
      </Text>
      <View
        style={[
          styles.list,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {items.map((item, index) => (
          <View
            key={`positive-${item.id}-${index}`}
            style={[
              styles.row,
              index < items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
            accessibilityLabel={item.title}
          >
            <View
              style={[
                styles.check,
                { backgroundColor: colors.successBackground },
              ]}
            >
              <Check size={16} color={colors.success} strokeWidth={3} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 24,
      marginTop: 16,
      marginBottom: 8,
    },
    sectionLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.bold,
      letterSpacing: 0.8,
      marginBottom: 14,
      textTransform: 'uppercase',
    },
    list: {
      borderRadius: 24,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      minHeight: 56,
    },
    check: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      flex: 1,
    },
  })
