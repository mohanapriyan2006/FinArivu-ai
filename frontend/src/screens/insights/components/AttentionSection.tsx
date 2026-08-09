import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import {
  Wallet,
  ShoppingBag,
  PiggyBank,
  PieChart,
  Target,
  Banknote,
  CreditCard,
  TrendingUp,
  Landmark,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { AttentionItem } from '../types'
import { InsightCard } from './InsightCard'

interface AttentionSectionProps {
  items: AttentionItem[]
  onPress: (item: AttentionItem) => void
  testID?: string
}

function iconForCategory(category: AttentionItem['category']): LucideIcon {
  switch (category) {
    case 'CASH_FLOW':
      return Wallet
    case 'SPENDING':
      return ShoppingBag
    case 'SAVINGS':
      return PiggyBank
    case 'BUDGET':
      return PieChart
    case 'GOAL':
      return Target
    case 'DEBT':
      return Banknote
    case 'CREDIT_CARD':
      return CreditCard
    case 'NET_WORTH':
      return TrendingUp
    case 'INVESTMENT':
      return Landmark
    default:
      return Wallet
  }
}

export function AttentionSection({
  items,
  onPress,
  testID,
}: AttentionSectionProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section} testID={testID}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        NEEDS ATTENTION
      </Text>
      {items.map((item) => (
        <InsightCard
          key={item.id}
          icon={iconForCategory(item.category)}
          title={item.title}
          explanation={item.explanation}
          actionLabel={item.actionLabel}
          onPress={() => onPress(item)}
          variant={item.category === 'BUDGET' ? 'warning' : 'danger'}
          testID={`attention-${item.id}`}
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
