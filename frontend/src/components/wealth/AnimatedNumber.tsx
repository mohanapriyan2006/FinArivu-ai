import React, { useEffect } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

interface AnimatedNumberProps {
  value: number
  style?: object
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

function formatCompactRupee(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs >= 1_00_00_000) {
    return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`
  }

  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(1)} L`
  }

  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`
}

export function AnimatedNumber({ value, style }: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value)

  useEffect(() => {
    animatedValue.value = withSpring(value, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    })
  }, [value, animatedValue])

  const animatedProps = useAnimatedProps(() => {
    'worklet'
    const v = animatedValue.value
    const sign = v < 0 ? '-' : ''
    const abs = Math.abs(v)
    let text = ''

    if (abs >= 1_00_00_000) {
      text = `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`
    } else if (abs >= 1_00_000) {
      text = `${sign}₹${(abs / 1_00_000).toFixed(1)} L`
    } else {
      text = `${sign}₹${Math.round(abs).toString()}`
    }

    return { text }
  })

  return (
    <AnimatedTextInput
      defaultValue={formatCompactRupee(value)}
      animatedProps={animatedProps as any}
      editable={false}
      style={[styles.text, style]}
      underlineColorAndroid="transparent"
    />
  )
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
  },
})
