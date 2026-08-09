import React from 'react'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
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
  Sparkles,
  AlertTriangle,
} from 'lucide-react-native'

import type { LucideIcon } from 'lucide-react-native'
import type { TopInsight } from '../types'
import { InsightCard } from './InsightCard'
import { StyleSheet, Text, View } from 'react-native'

interface TopInsightCardProps {
  insight: TopInsight
  onPress: () => void
  testID?: string
}

function iconForCategory(category: TopInsight['category']): LucideIcon {
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
    case 'RETIREMENT':
      return Sparkles
    case 'FINANCIAL_HEALTH':
    default:
      return AlertTriangle
  }
}

export function TopInsightCard({
  insight,
  onPress,
  testID,
}: TopInsightCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section} testID={testID}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        YOUR TOP INSIGHT
      </Text>
      <InsightCard
        icon={iconForCategory(insight.category)}
        title={insight.title}
        explanation={insight.explanation}
        metric={insight.metric}
        actionLabel={insight.actionLabel}
        onPress={onPress}
        variant="primary"
        testID={`${testID}-card`}
      />
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 24,
      marginTop: 8,
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
