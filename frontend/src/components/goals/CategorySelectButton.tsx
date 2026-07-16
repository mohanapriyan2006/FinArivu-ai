import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface CategorySelectButtonProps {
  icon: LucideIcon
  label: string
  selected: boolean
  onPress: () => void
  delay?: number
}

export function CategorySelectButton({
  icon: Icon,
  label,
  selected,
  onPress,
  delay = 0,
}: CategorySelectButtonProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.95)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
  }

  const dynamicStyle = selected
    ? {
        backgroundColor: colors.primaryBackground,
        borderColor: colors.primary,
        borderWidth: 2,
      }
    : {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      }

  const iconColor = selected ? colors.primary : colors.textSecondary
  const labelColor = selected ? colors.primary : colors.textPrimary

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify()}
      style={[styles.wrapper, dynamicStyle, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Icon size={24} color={iconColor} strokeWidth={2} />
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 0,
    },
    pressable: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      marginTop: 8,
      textAlign: 'center',
    },
  })
}
