import { type ReactNode } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated'

interface AIGlowProps {
  children: ReactNode
  minOpacity?: number
  maxOpacity?: number
  duration?: number
  testID?: string
}

export function AIGlow({
  children,
  minOpacity = 0.85,
  maxOpacity = 1,
  duration = 2500,
  testID,
}: AIGlowProps) {
  const opacity = useSharedValue(minOpacity)

  opacity.value = withRepeat(
    withSequence(
      withTiming(maxOpacity, { duration: duration / 2 }),
      withTiming(minOpacity, { duration: duration / 2 })
    ),
    -1,
    true
  )

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View testID={testID} style={animatedStyle}>
      {children}
    </Animated.View>
  )
}
