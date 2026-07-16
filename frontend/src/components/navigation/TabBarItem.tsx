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
          paddingHorizontal: 4,
          minHeight: 44,
        },
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 16,
          backgroundColor: colors.primary,
          gap: 6,
        },
        standardContent: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: 12,
          fontWeight: Typography.fontWeights.medium,
          marginTop: 2,
        },
      }),
    [colors.primary]
  )

  const activeColor = colors.surface
  const inactiveColor = colors.textSecondary

  if (variant === 'fab') {
    return (
      <AIFABWrapper onPress={onPress} accessibilityLabel={accessibilityLabel ?? label} testID={testID}>
        <Icon size={28} color={colors.surface} strokeWidth={2} />
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
          <Icon size={20} color={activeColor} strokeWidth={2} />
          <Text style={[styles.label, { color: activeColor }]}>{label}</Text>
        </MotiView>
      ) : (
        <View style={styles.standardContent}>
          <Icon size={22} color={inactiveColor} strokeWidth={2} />
          <Text style={[styles.label, { color: inactiveColor }]}>{label}</Text>
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
}

function AIFABWrapper({ children, onPress, accessibilityLabel, testID }: AIFABWrapperProps) {
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
          top: -43,
          left: '50%',
          marginLeft: -35,
          zIndex: 10,
        },
        fab: {
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: colors.primary,
          borderWidth: 6,
          borderColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 10,
        },
      }),
    [colors.primary, colors.surface, colors.shadowColor]
  )

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
