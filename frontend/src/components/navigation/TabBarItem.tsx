import { useMemo, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { type LucideIcon } from 'lucide-react-native'
import { MotiView } from 'moti'
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface TabBarItemProps {
  label: string
  icon: LucideIcon
  isActive: boolean
  onPress: () => void
  variant?: 'standard' | 'fab'
  accessibilityLabel?: string
  testID?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function TabBarItem({
  label,
  icon: Icon,
  isActive,
  onPress,
  variant = 'standard',
  accessibilityLabel,
  testID,
}: TabBarItemProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        standardContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 2,
          minHeight: 44,
        },
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderRadius: 16,
          backgroundColor: colors.primary,
          gap: 4,
        },
        standardContent: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
          paddingVertical: 8,
        },
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: 11,
          fontWeight: Typography.fontWeights.medium,
          marginTop: 2,
          textAlign: 'center',
          width: '100%',
        },
      }),
    [colors.primary]
  )

  const activeColor = colors.surface
  const inactiveColor = colors.textSecondary

  if (variant === 'fab') {
    return (
      <AIFABWrapper
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? label}
        testID={testID}
        isActive={isActive}
        label={label}
      >
        <Icon size={24} color={colors.surface} strokeWidth={2.5} />
      </AIFABWrapper>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      style={styles.standardContainer}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      {isActive ? (
        <MotiView layout={LinearTransition.springify().damping(14)} style={styles.pill}>
          <Icon size={24} color={activeColor} strokeWidth={2} />
        </MotiView>
      ) : (
        <View style={styles.standardContent}>
          <Icon size={28} color={inactiveColor} strokeWidth={2} />
        </View>
      )}
    </Pressable>
  )
}

interface AIFABWrapperProps {
  children: ReactNode
  onPress: () => void
  accessibilityLabel: string
  testID?: string
  isActive: boolean
  label: string
}

function AIFABWrapper({
  children,
  onPress,
  accessibilityLabel,
  testID,
  isActive,
  label,
}: AIFABWrapperProps) {
  const { colors } = useTheme()
  const pressScale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }))

  const handlePressIn = () => {
    pressScale.value = withSpring(0.92, { damping: 12, stiffness: 200 })
  }

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 200 })
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        breathing: {
          position: 'absolute',
          top: -38,
          left: '50%',
          marginLeft: -35,
          zIndex: 10,
          alignItems: 'center',
        },
        fab: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          borderWidth: 5,
          borderColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        fabLabel: {
          fontFamily: Typography.fontFamily,
          fontSize: 10,
          fontWeight: Typography.fontWeights.semibold,
          marginTop: 4,
          textAlign: 'center',
        },
      }),
    [colors.primary, colors.surface, colors.shadowColor]
  )

  const labelColor = isActive ? colors.primary : colors.textSecondary

  return (
    <MotiView
      testID={testID}
      style={styles.breathing}
      from={{ scale: 0.98 }}
      animate={{ scale: 1.02 }}
      transition={{
        type: 'timing',
        duration: 2200,
        loop: true,
        repeatReverse: true,
      }}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.fab, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    </MotiView>
  )
}
