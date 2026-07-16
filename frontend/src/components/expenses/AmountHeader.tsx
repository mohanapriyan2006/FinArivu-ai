import { useMemo } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface AmountHeaderProps {
  amount: string
  onAmountChange: (value: string) => void
}

export function AmountHeader({ amount, onAmountChange }: AmountHeaderProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ENTER AMOUNT</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currency}>₹</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={colors.primaryBackground}
          keyboardType="numeric"
          value={amount}
          onChangeText={onAmountChange}
          accessibilityLabel="Enter amount"
        />
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.heroCard,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 60,
      justifyContent: 'center',
      minHeight: 220,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primaryBackground,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 12,
    },
    currency: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: 48,
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
      padding: 0,
      height: 60,
    },
  })
