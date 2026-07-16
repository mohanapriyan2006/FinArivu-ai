import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface TimelineItemProps {
  year: string
  title: string
  date: string
  dotColor: string
  isLast?: boolean
  delay?: number
}

export function TimelineItem({
  year,
  title,
  date,
  dotColor,
  isLast = false,
  delay = 0,
}: TimelineItemProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify()}
      style={styles.row}
    >
      <View style={styles.leftColumn}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {!isLast && (
          <View
            style={[
              styles.line,
              { backgroundColor: dotColor },
            ]}
          />
        )}
      </View>
      <View style={styles.content}>
        <View
          style={[
            styles.yearPill,
            { backgroundColor: dotColor + '15' },
          ]}
        >
          <Text style={[styles.yearText, { color: dotColor }]}>{year}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </Animated.View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    leftColumn: {
      width: 24,
      alignItems: 'center',
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      zIndex: 1,
    },
    line: {
      position: 'absolute',
      top: 14,
      bottom: -26,
      left: 11,
      width: 2,
      opacity: 0.25,
    },
    content: {
      flex: 1,
      paddingTop: 0,
      paddingLeft: 12,
    },
    yearPill: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 8,
    },
    yearText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    date: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
  })
}
