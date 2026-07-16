import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { CARD_SHADOW } from '@/components/insights/Common'

interface GoalCardProps {
  icon: LucideIcon
  iconBackgroundColor: string
  iconColor: string
  title: string
  target: string
  current: string
  progress: number
  status: string
  statusColor: string
  onPress?: () => void
  delay?: number
}

export function GoalCard({
  icon: Icon,
  iconBackgroundColor,
  iconColor,
  title,
  target,
  current,
  progress,
  status,
  statusColor,
  onPress,
  delay = 0,
}: GoalCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.97)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
  }

  const percent = Math.round(progress * 100)

  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify()}
      style={[styles.card, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={styles.topRow}>
          <View
            style={[styles.iconBox, { backgroundColor: iconBackgroundColor }]}
          >
            <Icon size={20} color={iconColor} strokeWidth={2} />
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusColor + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.target}>{target}</Text>

        <View style={styles.footer}>
          <Text style={styles.current}>{current}</Text>
          <Text style={[styles.percent, { color: statusColor }]}>
            {percent}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      width: 260,
      marginRight: 12,
      ...CARD_SHADOW,
    },
    pressable: {
      flex: 1,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    target: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    current: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    percent: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
  })
}
