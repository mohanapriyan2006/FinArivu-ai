import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Plus } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { MissingDataItem } from '../types'
import { InsightCard } from './InsightCard'

interface MissingDataSectionProps {
  items: MissingDataItem[]
  onPress: (item: MissingDataItem) => void
  testID?: string
}

export function MissingDataSection({
  items,
  onPress,
  testID,
}: MissingDataSectionProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section} testID={testID}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        COMPLETE YOUR FINANCES
      </Text>
      {items.map((item) => (
        <InsightCard
          key={item.id}
          icon={Plus}
          title={item.title}
          explanation={item.explanation}
          actionLabel={item.actionLabel}
          onPress={() => onPress(item)}
          variant="primary"
          testID={`insights-missing-${item.id}`}
        />
      ))}
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
  })
