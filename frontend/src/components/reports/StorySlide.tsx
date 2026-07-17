import React from 'react'
import { StyleSheet } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

interface StorySlideProps {
  backgroundColor: string
  children: React.ReactNode
}

export function StorySlide({ backgroundColor, children }: StorySlideProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400).springify()}
      style={[styles.slide, { backgroundColor }]}
    >
      <Animated.View
        entering={FadeIn.delay(120).duration(500).springify()}
        style={styles.content}
      >
        {children}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  slide: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
})
