import React, { useMemo, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Animated, { FadeInUp } from 'react-native-reanimated'
import Svg, { Circle, Path } from 'react-native-svg'
import { ChevronLeft, Sparkles, TrendingUp } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { CARD_SHADOW } from '@/components/insights/Common'
import type { RootStackParamList } from '@/navigation/AppNavigator'

const STORY_IMAGE =
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&auto=format&fit=crop&q=60'

interface Point {
  x: number
  y: number
}

function getCubicBezierPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t
  const u2 = u * u
  const u3 = u2 * u
  const t2 = t * t
  const t3 = t2 * t

  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  }
}

function JourneyPath({ width, height }: { width: number; height: number }) {
  const { colors } = useTheme()

  const paddingX = 20
  const start: Point = { x: paddingX, y: height * 0.55 }
  const end: Point = { x: width - paddingX, y: height * 0.45 }
  const control1: Point = { x: width * 0.35, y: height * 0.2 }
  const control2: Point = { x: width * 0.65, y: height * 0.9 }

  const pathD = `M ${start.x},${start.y} C ${control1.x},${control1.y} ${control2.x},${control2.y} ${end.x},${end.y}`

  const pastMilestones = useMemo(
    () => [0.15, 0.4, 0.6].map((t) => getCubicBezierPoint(start, control1, control2, end, t)),
    [start, control1, control2, end]
  )
  const currentPoint = useMemo(
    () => getCubicBezierPoint(start, control1, control2, end, 0.78),
    [start, control1, control2, end]
  )
  const destinationPoint = useMemo(
    () => getCubicBezierPoint(start, control1, control2, end, 1),
    [start, control1, control2, end]
  )

  return (
    <Svg width={width} height={height} style={{ opacity: 0.99 }}>
      <Path
        d={pathD}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />

      {pastMilestones.map((point, index) => (
        <Circle
          key={`past-${index}`}
          cx={point.x}
          cy={point.y}
          r={6}
          fill={colors.primary}
        />
      ))}

      <Circle
        cx={currentPoint.x}
        cy={currentPoint.y}
        r={14}
        fill={colors.accent}
        opacity={0.25}
      />
      <Circle
        cx={currentPoint.x}
        cy={currentPoint.y}
        r={8}
        fill={colors.accent}
      />

      <Circle
        cx={destinationPoint.x}
        cy={destinationPoint.y}
        r={6}
        fill="rgba(255,255,255,0.4)"
      />
    </Svg>
  )
}

export default function GoalJourneyScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [journeyWidth, setJourneyWidth] = useState(0)
  const journeyHeight = 180

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(0).springify()}>
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              style={styles.iconButton}
              accessibilityRole="button"
            >
              <ChevronLeft
                size={24}
                color={colors.textPrimary}
                strokeWidth={2}
              />
            </Pressable>
            <Text style={styles.headerTitle}>Goal Journey</Text>
            <View style={styles.iconButton} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroTitle}>Dream House Fund</Text>
                <Text style={styles.heroSubtitle}>
                  Progress: 75% complete
                </Text>
              </View>
              <View style={styles.momentumPill}>
                <TrendingUp
                  size={14}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  style={styles.momentumIcon}
                />
                <Text style={styles.momentumText}>Increasing Momentum</Text>
              </View>
            </View>

            <View
              style={styles.journeyContainer}
              onLayout={(event) =>
                setJourneyWidth(event.nativeEvent.layout.width)
              }
            >
              {journeyWidth > 0 && (
                <JourneyPath width={journeyWidth} height={journeyHeight} />
              )}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <View style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <View style={styles.forecastIconBox}>
                <Sparkles
                  size={20}
                  color={colors.accent}
                  strokeWidth={2.5}
                />
              </View>
              <Text style={styles.forecastTitle}>AI Acceleration Forecast</Text>
            </View>

            <View style={[styles.nestedCard, { backgroundColor: colors.background }]}>
              <Text style={styles.nestedLabel}>CURRENT PACE</Text>
              <Text style={[styles.nestedValue, { color: colors.textPrimary }]}>
                January 2028
              </Text>
            </View>

            <View
              style={[styles.nestedCard, { backgroundColor: colors.primaryBackground }]}
            >
              <Text style={styles.nestedLabel}>OPTIMIZED PATH</Text>
              <View style={styles.optimizedRow}>
                <Text style={[styles.nestedValue, { color: colors.primary }]}>
                  July 2027
                </Text>
                <View style={styles.savedPill}>
                  <Text style={styles.savedPillText}>+6 Months</Text>
                </View>
              </View>
              <Text style={styles.nestedSubtext}>
                Increase SIP by 10% to reach your goal earlier without
                compromising other goals.
              </Text>
            </View>

            <Pressable
              onPress={() => {}}
              style={styles.forecastButton}
              accessibilityRole="button"
            >
              <Text style={styles.forecastButtonText}>
                Unlock 10% Accelerator Plan {'>'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <View style={styles.storyCard}>
            <Image
              source={{ uri: STORY_IMAGE }}
              style={styles.storyImage}
              resizeMode="cover"
            />
            <View style={styles.storyContent}>
              <Text style={styles.storyTitle}>Your Goal Story</Text>
              <Text style={styles.storyBody}>
                You have been consistent for{' '}
                <Text
                  style={[
                    styles.storyHighlight,
                    { color: colors.primary, fontWeight: Typography.fontWeights.bold },
                  ]}
                >
                  12 months
                </Text>{' '}
                and saved{' '}
                <Text
                  style={[
                    styles.storyHighlight,
                    { color: colors.success, fontWeight: Typography.fontWeights.bold },
                  ]}
                >
                  15%
                </Text>{' '}
                more than planned. Stay on this path to unlock the milestone
                reward.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 20,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    heroCard: {
      backgroundColor: colors.heroCard,
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      ...CARD_SHADOW,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    heroTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: '#FFFFFF',
      marginBottom: 4,
    },
    heroSubtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: 'rgba(255,255,255,0.8)',
    },
    momentumPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    momentumIcon: {
      marginRight: 4,
    },
    momentumText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: '#FFFFFF',
    },
    journeyContainer: {
      height: 180,
      width: '100%',
    },
    forecastCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      padding: 20,
      marginBottom: 24,
      ...CARD_SHADOW,
    },
    forecastHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    forecastIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.accentBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    forecastTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    nestedCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    nestedLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    nestedValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
    },
    optimizedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    savedPill: {
      backgroundColor: colors.successBackground,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    savedPillText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.success,
    },
    nestedSubtext: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    forecastButton: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    forecastButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primaryDark,
    },
    storyCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      ...CARD_SHADOW,
    },
    storyImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.border,
    },
    storyContent: {
      flex: 1,
    },
    storyTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    storyBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    storyHighlight: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
    },
  })
}
