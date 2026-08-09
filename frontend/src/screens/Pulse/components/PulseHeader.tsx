import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface PulseHeaderProps {
  testID?: string
}

export function PulseHeader({ testID }: PulseHeaderProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Pulse</Text>
      <Text style={styles.subtitle}>Your financial control center</Text>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h1,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textHero,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
  })
