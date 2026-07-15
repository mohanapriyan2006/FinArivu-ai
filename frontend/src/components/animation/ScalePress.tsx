import { type ReactNode } from 'react'
import { Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface ScalePressProps {
  children: ReactNode
  onPress?: () => void
  scale?: number
  testID?: string
  accessibilityRole?: 'button' | 'link'
  accessibilityLabel?: string
}

export function ScalePress({
  children,
  onPress,
  scale = 0.97,
  testID,
  accessibilityRole = 'button',
  accessibilityLabel,
}: ScalePressProps) {
  const pressed = useSharedValue(false)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? scale : 1, { damping: 15, stiffness: 300 }) },
    ],
  }))

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => (pressed.value = true)}
      onPressOut={() => (pressed.value = false)}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={animatedStyle}
    >
      {children}
    </AnimatedPressable>
  )
}
