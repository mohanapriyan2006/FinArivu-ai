import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface ThinkingAnimationProps {
  stepText?: string
}

export function ThinkingAnimation({ stepText = 'Planning analysis...' }: ThinkingAnimationProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const dot1Scale = useSharedValue(0.8)
  const dot2Scale = useSharedValue(0.8)
  const dot3Scale = useSharedValue(0.8)

  useEffect(() => {
    dot1Scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 400 }),
        withTiming(0.8, { duration: 400 })
      ),
      -1,
      true
    )
    dot2Scale.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(1.4, { duration: 400 }),
        withTiming(0.8, { duration: 400 })
      ),
      -1,
      true
    )
    dot3Scale.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 400 }),
        withTiming(1.4, { duration: 400 }),
        withTiming(0.8, { duration: 400 })
      ),
      -1,
      true
    )
  }, [dot1Scale, dot2Scale, dot3Scale])

  const dot1Style = useAnimatedStyle(() => ({ transform: [{ scale: dot1Scale.value }] }))
  const dot2Style = useAnimatedStyle(() => ({ transform: [{ scale: dot2Scale.value }] }))
  const dot3Style = useAnimatedStyle(() => ({ transform: [{ scale: dot3Scale.value }] }))

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot1Style]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.secondary }, dot2Style]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.success }, dot3Style]} />
        </View>
        <Text style={styles.stepText}>{stepText}</Text>
      </View>
    </Animated.View>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      marginVertical: 8,
      marginLeft: 20,
      maxWidth: '85%',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    stepText: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontWeight: '500',
      fontSize: 13,
    },
  })
