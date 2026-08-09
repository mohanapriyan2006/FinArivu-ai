import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import type { ThemeColors } from '@/theme'

interface TrackerSkeletonProps {
  testID?: string
}

export function TrackerSkeleton({ testID }: TrackerSkeletonProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.bar, styles.header, { backgroundColor: colors.border }]} />
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={[styles.bar, { backgroundColor: colors.border, width: '60%' }]} />
        <View style={[styles.bar, { backgroundColor: colors.border, width: '80%' }]} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={[styles.bar, { backgroundColor: colors.border, width: '70%' }]} />
        <View style={[styles.bar, { backgroundColor: colors.border, width: '90%' }]} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={[styles.bar, { backgroundColor: colors.border, width: '75%' }]} />
        <View style={[styles.bar, { backgroundColor: colors.border, width: '50%' }]} />
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    header: {
      marginBottom: 16,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bar: {
      height: 14,
      borderRadius: 7,
      marginBottom: 10,
    },
  })
