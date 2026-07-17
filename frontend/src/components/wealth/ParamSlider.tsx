import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onValueChange: (value: number) => void
}

const THUMB_SIZE = 20
const TRACK_HEIGHT = 6

export function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onValueChange,
}: ParamSliderProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const progress = useSharedValue((value - min) / (max - min))
  const trackWidth = useSharedValue(0)

  useEffect(() => {
    progress.value = (value - min) / (max - min)
  }, [value, min, max, progress])

  const updateValueFromX = (x: number) => {
    'worklet'
    const width = trackWidth.value || 1
    const rawProgress = Math.min(Math.max(x / width, 0), 1)
    progress.value = rawProgress

    const rawValue = min + rawProgress * (max - min)
    const steppedValue = min + Math.round((rawValue - min) / step) * step
    const clampedValue = Math.min(Math.max(steppedValue, min), max)
    runOnJS(onValueChange)(clampedValue)
  }

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      updateValueFromX(event.x)
    })
    .onUpdate((event) => {
      updateValueFromX(event.x)
    })

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: progress.value * trackWidth.value,
  }))

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: progress.value * trackWidth.value - THUMB_SIZE / 2,
      },
    ],
  }))

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      <GestureDetector gesture={gesture}>
        <View
          style={styles.trackContainer}
          onLayout={(event) => {
            trackWidth.value = event.nativeEvent.layout.width
          }}
        >
          <View style={styles.track}>
            <Animated.View style={[styles.activeTrack, activeTrackStyle]} />
          </View>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    value: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    trackContainer: {
      height: 32,
      justifyContent: 'center',
    },
    track: {
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: colors.primaryBackground,
      overflow: 'hidden',
    },
    activeTrack: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.primary,
      borderRadius: TRACK_HEIGHT / 2,
    },
    thumb: {
      position: 'absolute',
      top: (32 - THUMB_SIZE) / 2,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: colors.primary,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
  })
}
