import React from 'react'
import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import type { ThemeColors } from '@/theme'

export function InsightsSkeleton() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.wrapper} testID="insights-skeleton">
      <View style={styles.title} />
      <View style={styles.subtitle} />

      <View style={styles.gauge} />
      <View style={styles.factors} />

      <View style={styles.sectionTitle} />
      <View style={styles.card} />

      <View style={styles.sectionTitle} />
      <View style={styles.chipRow}>
        <View style={styles.chip} />
        <View style={styles.chip} />
        <View style={styles.chip} />
        <View style={styles.chip} />
      </View>

      <View style={styles.sectionTitle} />
      <View style={styles.row} />
      <View style={styles.row} />
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
    },
    title: {
      width: 120,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginBottom: 8,
      alignSelf: 'center',
    },
    subtitle: {
      width: 180,
      height: 18,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 20,
      alignSelf: 'center',
    },
    gauge: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    factors: {
      height: 24,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 24,
    },
    sectionTitle: {
      width: 120,
      height: 14,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    card: {
      height: 180,
      borderRadius: 24,
      backgroundColor: colors.border,
      marginBottom: 16,
    },
    chipRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    chip: {
      flex: 1,
      height: 90,
      borderRadius: 20,
      backgroundColor: colors.border,
    },
    row: {
      height: 72,
      borderRadius: 20,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
  })
