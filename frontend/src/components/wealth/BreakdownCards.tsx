import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TrendingDown, TrendingUp, Wallet, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { BaseColors, Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface BreakdownItem {
  icon: LucideIcon
  title: string
  value: string
  iconColor: string
  iconBackground: string
}

interface BreakdownCardsProps {
  totalPrincipal: number
  estimatedReturns: number
  inflationImpact: number
  formatter: (value: number) => string
}

export function BreakdownCards({
  totalPrincipal,
  estimatedReturns,
  inflationImpact,
  formatter,
}: BreakdownCardsProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const items: BreakdownItem[] = [
    {
      icon: Wallet,
      title: 'Total Principal',
      value: formatter(totalPrincipal),
      iconColor: BaseColors.warning,
      iconBackground: BaseColors.warningLight,
    },
    {
      icon: TrendingUp,
      title: 'Estimated Returns',
      value: formatter(estimatedReturns),
      iconColor: BaseColors.success,
      iconBackground: BaseColors.successLight,
    },
    {
      icon: TrendingDown,
      title: 'Inflation Impact',
      value: formatter(inflationImpact),
      iconColor: BaseColors.danger,
      iconBackground: BaseColors.dangerLight,
    },
  ]

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <View key={item.title} style={styles.card}>
            <View
              style={[styles.iconBox, { backgroundColor: item.iconBackground }]}
            >
              <Icon size={22} color={item.iconColor} strokeWidth={2.5} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text
                style={[
                  styles.value,
                  { color: item.title === 'Inflation Impact' ? colors.danger : colors.textPrimary },
                ]}
              >
                {item.value}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: 12,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    value: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
    },
  })
}
