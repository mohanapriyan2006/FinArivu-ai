import React from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

interface StoryProgressBarProps {
  total: number
  currentIndex: number
  progress: SharedValue<number>
}

export function StoryProgressBar({
  total,
  currentIndex,
  progress,
}: StoryProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <Segment
          key={index}
          index={index}
          currentIndex={currentIndex}
          progress={progress}
        />
      ))}
    </View>
  )
}

interface SegmentProps {
  index: number
  currentIndex: number
  progress: SharedValue<number>
}

function Segment({ index, currentIndex, progress }: SegmentProps) {
  const currentIndexSV = useSharedValue(currentIndex)
  const segmentWidth = useSharedValue(0)

  React.useEffect(() => {
    currentIndexSV.value = currentIndex
  }, [currentIndex, currentIndexSV])

  const animatedStyle = useAnimatedStyle(() => {
    const current = currentIndexSV.value
    let width = 0

    if (index < current) {
      width = segmentWidth.value
    } else if (index === current) {
      width = progress.value * segmentWidth.value
    }

    return { width }
  })

  return (
    <View
      style={styles.segmentTrack}
      onLayout={(event) => {
        segmentWidth.value = event.nativeEvent.layout.width
      }}
    >
      <Animated.View style={[styles.segmentFill, animatedStyle]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
    zIndex: 20,
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  segmentFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
})
