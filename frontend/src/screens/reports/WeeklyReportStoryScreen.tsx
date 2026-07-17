import React, { useCallback, useEffect, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Animated, {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { StatusBar } from 'expo-status-bar'
import { Award, Bot, Share2, Target, X } from 'lucide-react-native'
import Svg, { Circle } from 'react-native-svg'

import { useTheme } from '@/contexts/ThemeContext'
import { BaseColors, Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'

import { StorySlide } from '@/components/reports/StorySlide'
import { StoryProgressBar } from '@/components/reports/StoryProgressBar'

const SLIDE_COUNT = 7
const SLIDE_DURATION = 5000

const SAVINGS_PROGRESS = 0.31
const GOAL_PROGRESS = 0.65
const HEALTH_SCORE = 782
const HEALTH_POINTS = 3
const TOTAL_SPENT = '₹12,850'
const FOOD_SPENT = '₹3,200'
const DATE_RANGE = 'June 15 - June 21'
const GOAL_NAME = 'Emergency Fund'

export default function WeeklyReportStoryScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { width, height } = useWindowDimensions()
  const styles = makeStyles(colors, insets.bottom)

  const [currentIndex, setCurrentIndex] = useState(0)
  const progress = useSharedValue(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < SLIDE_COUNT - 1 ? prev + 1 : prev))
  }, [])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const restartProgress = useCallback(() => {
    progress.value = 0
    progress.value = withTiming(
      1,
      { duration: SLIDE_DURATION, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(goToNext)()
        }
      }
    )
  }, [goToNext, progress])

  useEffect(() => {
    restartProgress()
  }, [currentIndex, restartProgress])

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Main')
    }
  }

  const handleShare = () => {}
  const handleDownload = () => {}

  const renderSlide = (index: number) => {
    switch (index) {
      case 0:
        return renderIntroSlide()
      case 1:
        return renderSpendingSlide(width, height)
      case 2:
        return renderSavingsSlide()
      case 3:
        return renderGoalsSlide()
      case 4:
        return renderHealthScoreSlide()
      case 5:
        return renderAISummarySlide()
      case 6:
        return renderOutroSlide()
      default:
        return null
    }
  }

  const overlayBottom = currentIndex === SLIDE_COUNT - 1 ? 170 + insets.bottom : 0

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={styles.root}>
        {renderSlide(currentIndex)}

        <StoryProgressBar
          total={SLIDE_COUNT}
          currentIndex={currentIndex}
          progress={progress}
        />

        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close story"
        >
          <X size={22} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        <View style={[styles.tapOverlays, { bottom: overlayBottom }]}>
          <Pressable
            style={styles.leftTap}
            onPress={goToPrevious}
            accessibilityRole="button"
            accessibilityLabel="Previous slide"
          />
          <Pressable
            style={styles.rightTap}
            onPress={goToNext}
            accessibilityRole="button"
            accessibilityLabel="Next slide"
          />
        </View>

        {currentIndex === SLIDE_COUNT - 1 && (
          <View style={styles.bottomActions}>
            <Pressable
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
              accessibilityRole="button"
            >
              <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Share Achievement</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.downloadButton]}
              onPress={handleDownload}
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>Download Report (PDF)</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

function renderIntroSlide() {
  return (
    <StorySlide backgroundColor="#0A4CC5">
      <View style={stylesIntro.center}>
        <View style={stylesIntro.iconCircle}>
          <Award size={48} color="#F4B400" strokeWidth={2} />
        </View>
        <Text style={stylesIntro.title}>Your Financial Week</Text>
        <Text style={stylesIntro.date}>{DATE_RANGE}</Text>
      </View>
    </StorySlide>
  )
}

const stylesIntro = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(244, 180, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  date: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
})

function renderSpendingSlide(width: number, height: number) {
  return (
    <StorySlide backgroundColor="#0A4CC5">
      <View style={stylesSpending.container}>
        <View style={stylesSpending.topLeft}>
          <Text style={stylesSpending.label}>SPENT THIS WEEK</Text>
          <Text style={stylesSpending.amount}>{TOTAL_SPENT}</Text>
        </View>

        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
          }}
          style={[
            stylesSpending.foodImage,
            { width: width * 0.75, height: height * 0.42 },
          ]}
          imageStyle={{ borderRadius: 24 }}
          resizeMode="cover"
        >
          <View style={stylesSpending.imageOverlay}>
            <Text style={stylesSpending.category}>Food & Dining</Text>
            <Text style={stylesSpending.categoryAmount}>{FOOD_SPENT}</Text>
          </View>
        </ImageBackground>
      </View>
    </StorySlide>
  )
}

const stylesSpending = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 32,
  },
  topLeft: {
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amount: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
  },
  foodImage: {
    alignSelf: 'flex-end',
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    padding: 20,
    borderRadius: 24,
  },
  category: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryAmount: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: '#F4B400',
  },
})

function renderSavingsSlide() {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - SAVINGS_PROGRESS)

  return (
    <StorySlide backgroundColor="#064E3B">
      <View style={stylesSavings.center}>
        <View style={stylesSavings.ringContainer}>
          <Svg width={168} height={168} style={stylesSavings.svg}>
            <Circle
              cx={84}
              cy={84}
              r={radius}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth={10}
              fill="none"
            />
            <Circle
              cx={84}
              cy={84}
              r={radius}
              stroke="#86EFAC"
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              transform="rotate(-90 84 84)"
            />
          </Svg>
          <View style={stylesSavings.ringLabel}>
            <Text style={stylesSavings.percent}>31%</Text>
            <Text style={stylesSavings.saved}>SAVED</Text>
          </View>
        </View>
        <Text style={stylesSavings.excellent}>Excellent!</Text>
      </View>
    </StorySlide>
  )
}

const stylesSavings = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  ringContainer: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  svg: {
    position: 'absolute',
  },
  ringLabel: {
    alignItems: 'center',
  },
  percent: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes['2.5xl'],
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
  },
  saved: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
  },
  excellent: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
  },
})

function renderGoalsSlide() {
  return (
    <StorySlide backgroundColor="#4C1D95">
      <View style={stylesGoals.center}>
        <View style={stylesGoals.iconCircle}>
          <Target size={48} color="#F4B400" strokeWidth={2} />
        </View>
        <Text style={stylesGoals.title}>{GOAL_NAME}</Text>
        <View style={stylesGoals.progressContainer}>
          <View style={stylesGoals.progressTrack}>
            <View
              style={[
                stylesGoals.progressFill,
                { width: `${GOAL_PROGRESS * 100}%` },
              ]}
            />
          </View>
          <Text style={stylesGoals.progressText}>
            {Math.round(GOAL_PROGRESS * 100)}% funded
          </Text>
        </View>
      </View>
    </StorySlide>
  )
}

const stylesGoals = StyleSheet.create({
  center: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F4B400',
    borderRadius: 6,
  },
  progressText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
})

function renderHealthScoreSlide() {
  return (
    <StorySlide backgroundColor="#F5F3FF">
      <View style={stylesHealthScore.center}>
        <View style={stylesHealthScore.card}>
          <Text style={stylesHealthScore.label}>Health Score</Text>
          <Text style={stylesHealthScore.score}>{HEALTH_SCORE}</Text>
          <Text style={stylesHealthScore.points}>+{HEALTH_POINTS} Points</Text>
        </View>
      </View>
    </StorySlide>
  )
}

const stylesHealthScore = StyleSheet.create({
  center: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  score: {
    fontFamily: Typography.fontFamily,
    fontSize: 56,
    fontWeight: Typography.fontWeights.bold,
    color: '#0F172A',
    marginBottom: 8,
  },
  points: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: BaseColors.success,
  },
})

function renderAISummarySlide() {
  return (
    <StorySlide backgroundColor="#F8FAFC">
      <View style={stylesAISummary.center}>
        <View style={stylesAISummary.card}>
          <View style={stylesAISummary.iconBox}>
            <Bot size={32} color="#0A4CC5" strokeWidth={2} />
          </View>
          <Text style={stylesAISummary.title}>
            A healthy week with conscious choices.
          </Text>
          <Text style={stylesAISummary.body}>
            Your spending stayed within budget across discretionary categories,
            while savings improved 31% compared to last week. Dining expenses
            remained controlled and emergency contributions are on track. Keep
            maintaining this balance for a stronger month-end health score.
          </Text>
        </View>
      </View>
    </StorySlide>
  )
}

const stylesAISummary = StyleSheet.create({
  center: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  body: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.regular,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
})

function renderOutroSlide() {
  return (
    <StorySlide backgroundColor="#000000">
      <View style={stylesOutro.center}>
        <View style={stylesOutro.badge}>
          <Award size={56} color="#F4B400" strokeWidth={2} />
        </View>
        <Text style={stylesOutro.title}>Smart Saver</Text>
        <Text style={stylesOutro.subtitle}>
          You saved more than 30% of your income this week.
        </Text>
      </View>
    </StorySlide>
  )
}

const stylesOutro = StyleSheet.create({
  center: {
    alignItems: 'center',
    marginTop: -80,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(244, 180, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(244, 180, 0, 0.4)',
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
})

function makeStyles(colors: ThemeColors, bottomInset: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    root: {
      flex: 1,
    },
    closeButton: {
      position: 'absolute',
      top: 18,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 30,
    },
    tapOverlays: {
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      zIndex: 10,
    },
    leftTap: {
      width: '30%',
      backgroundColor: 'transparent',
    },
    rightTap: {
      width: '70%',
      backgroundColor: 'transparent',
    },
    bottomActions: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: Math.max(bottomInset, 16) + 16,
      gap: 12,
      zIndex: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 18,
      minHeight: 56,
      gap: 10,
    },
    shareButton: {
      backgroundColor: colors.primary,
    },
    downloadButton: {
      backgroundColor: '#374151',
    },
    actionButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: '#FFFFFF',
    },
  })
}
