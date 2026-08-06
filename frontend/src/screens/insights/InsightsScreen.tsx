import React, { useMemo, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useWindowDimensions,
  Pressable,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import {
  Bot,
  Settings,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  PiggyBank,
  ShoppingBag,
  Flame,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface VitalityGaugeProps {
  isDark: boolean
  colors: any
}

// 1. VitalityGauge Component
const VitalityGauge: React.FC<VitalityGaugeProps> = ({ isDark, colors }) => {
  const progress1 = useSharedValue(0)
  const progress2 = useSharedValue(0)
  const floatAnim = useSharedValue(0)

  useEffect(() => {
    progress1.value = 0
    progress2.value = 0
    progress1.value = withTiming(0.82, {
      duration: 1500,
      easing: Easing.out(Easing.quad),
    })
    progress2.value = withTiming(0.68, {
      duration: 1500,
      easing: Easing.out(Easing.quad),
    })

    // Loop floating breathing animation
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )
  }, [])

  // Radius = 80 => Circumference = 2 * PI * 80 ≈ 502.65
  const animatedProps1 = useAnimatedProps(() => {
    const strokeDashoffset = 502.65 * (1 - progress1.value)
    return {
      strokeDashoffset,
    }
  })

  // Radius = 65 => Circumference = 2 * PI * 65 ≈ 408.41
  const animatedProps2 = useAnimatedProps(() => {
    const strokeDashoffset = 408.41 * (1 - progress2.value)
    return {
      strokeDashoffset,
    }
  })

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }))

  const trackColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
  const circle1Color = '#16A34A' // Success Green outer track
  const circle2Color = '#4F46E5' // Indigo primary inner track

  return (
    <View style={styles.gaugeWrapper}>
      <View style={styles.gaugeRotateContainer}>
        <Svg width={200} height={200}>
          {/* Outer Track */}
          <Circle
            cx={100}
            cy={100}
            r={80}
            stroke={trackColor}
            strokeWidth={4}
            fill="none"
          />
          {/* Outer Fill */}
          <AnimatedCircle
            cx={100}
            cy={100}
            r={80}
            stroke={circle1Color}
            strokeWidth={4}
            fill="none"
            strokeDasharray={502.65}
            animatedProps={animatedProps1}
            strokeLinecap="round"
          />

          {/* Inner Track */}
          <Circle
            cx={100}
            cy={100}
            r={65}
            stroke={trackColor}
            strokeWidth={4}
            fill="none"
          />
          {/* Inner Fill */}
          <AnimatedCircle
            cx={100}
            cy={100}
            r={65}
            stroke={circle2Color}
            strokeWidth={4}
            fill="none"
            strokeDasharray={408.41}
            animatedProps={animatedProps2}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Center Label Overlay */}
      <View style={styles.gaugeCenterText}>
        <Text style={styles.gaugeScoreText}>82</Text>
        <Text style={[styles.gaugeStatusText, { color: colors.textSecondary }]}>
          STABLE
        </Text>
      </View>

      {/* Floating Badge 1 (Liquidity - Top Right) */}
      <Animated.View
        style={[
          styles.floatingBadge,
          styles.badgeLiquidity,
          isDark ? styles.floatingBadgeDark : styles.floatingBadgeLight,
          floatStyle,
        ]}
      >
        <View style={styles.statusDotGreen} />
        <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
          Liquidity
        </Text>
      </Animated.View>

      {/* Floating Badge 2 (Debt - Bottom Left) */}
      <Animated.View
        style={[
          styles.floatingBadge,
          styles.badgeDebt,
          isDark ? styles.floatingBadgeDark : styles.floatingBadgeLight,
          floatStyle,
        ]}
      >
        <View style={styles.statusDotGreen} />
        <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
          Debt
        </Text>
      </Animated.View>
    </View>
  )
}

interface GlassInsightCardProps {
  children: React.ReactNode
  style?: any
  isDark: boolean
}

// 2. Reusable Glassmorphic Card for the Masonry Grid
const GlassInsightCard: React.FC<GlassInsightCardProps> = ({
  children,
  style,
  isDark,
}) => {
  return (
    <View
      style={[
        styles.glassContainer,
        isDark ? styles.glassContainerDark : styles.glassContainerLight,
        style,
      ]}
    >
      <BlurView
        intensity={isDark ? 35 : 55}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardPadding}>{children}</View>
    </View>
  )
}

interface StatTileProps {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<any>
  colors: any
  isDark: boolean
}

// 3. StatTile Component (Horizontal scroll item)
const StatTile: React.FC<StatTileProps> = ({
  title,
  value,
  subtitle,
  icon: IconComponent,
  colors,
  isDark,
}) => {
  return (
    <View
      style={[
        styles.statTile,
        isDark ? styles.statTileDark : styles.statTileLight,
      ]}
    >
      <BlurView
        intensity={isDark ? 25 : 45}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tilePadding}>
        <View style={styles.tileHeader}>
          <IconComponent size={14} color="#4F46E5" />
          <Text
            style={[styles.tileTitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Text style={[styles.tileValue, { color: colors.textPrimary }]}>
          {value}
        </Text>
        <Text
          style={[styles.tileSubtitle, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  )
}

// 4. InsightsScreen Screen
export default function InsightsScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Bot size={20} color="#4F46E5" />
          </View>
          <Text style={styles.headerTitle}>Cognitive Finance</Text>
          <Pressable style={styles.settingsButton} hitSlop={8}>
            <Settings size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          {/* Hero Section: System Vitality Gauge */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
              SYSTEM VITALITY
            </Text>
            <VitalityGauge isDark={isDark} colors={colors} />
          </View>

          {/* Asymmetrical Masonry Grid */}
          <View style={styles.masonryGrid}>
            {/* Left Column (Anomaly Card) */}
            <View style={styles.masonryColumn}>
              <GlassInsightCard isDark={isDark} style={styles.anomalyCard}>
                {/* Glow Background Overlay */}
                <View
                  style={[
                    styles.anomalyGlow,
                    { backgroundColor: 'rgba(220, 38, 38, 0.08)' },
                  ]}
                />
                <View style={styles.alertHeader}>
                  <AlertTriangle size={24} color="#DC2626" />
                </View>
                <Text style={[styles.cardTitleText, { color: colors.textPrimary }]}>
                  Anomaly
                </Text>
                <Text style={[styles.cardDescText, { color: colors.textSecondary }]}>
                  Unusual subscription charge detected.
                </Text>
                <Text style={styles.actionReqText}>Action Req -{'>'}</Text>
              </GlassInsightCard>
            </View>

            {/* Right Column (Velocity & AI Sync Cards) */}
            <View style={styles.masonryColumn}>
              {/* Top Card: Velocity */}
              <GlassInsightCard isDark={isDark} style={styles.halfCard}>
                <View style={styles.velocityHeader}>
                  <TrendingUp size={16} color="#16A34A" />
                  <Text
                    style={[styles.cardTitleTextSmall, { color: colors.textPrimary }]}
                  >
                    Velocity
                  </Text>
                </View>
                <Text
                  style={[styles.velocityValue, { color: colors.textPrimary }]}
                >
                  +$2.4k
                </Text>
                <Text style={styles.velocitySub}>+12% vs last week</Text>
              </GlassInsightCard>

              {/* Bottom Card: AI Sync */}
              <GlassInsightCard isDark={isDark} style={styles.halfCard}>
                <View
                  style={[
                    styles.aiSyncGlow,
                    { backgroundColor: 'rgba(79, 70, 229, 0.08)' },
                  ]}
                />
                <View style={styles.syncHeader}>
                  <Sparkles size={16} color="#4F46E5" />
                  <Text
                    style={[styles.cardTitleTextSmall, { color: colors.textPrimary }]}
                  >
                    AI Sync
                  </Text>
                </View>
                <Text style={[styles.syncDescText, { color: colors.textSecondary }]}>
                  Optimization patterns identified.
                </Text>
              </GlassInsightCard>
            </View>
          </View>

          {/* Weekly Stats Section */}
          <View style={styles.statsSection}>
            <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
              WEEKLY STATS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              <StatTile
                title="Savings Rate"
                value="32%"
                subtitle="Target: 30%"
                icon={PiggyBank}
                colors={colors}
                isDark={isDark}
              />
              <StatTile
                title="Top Spend"
                value="Dining"
                subtitle="₹12,450"
                icon={ShoppingBag}
                colors={colors}
                isDark={isDark}
              />
              <StatTile
                title="Cash Burn"
                value="Low"
                subtitle="Stable runway"
                icon={Flame}
                colors={colors}
                isDark={isDark}
              />
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24, // Spacing scale
    paddingVertical: 16, // Spacing scale
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 18,
    fontWeight: Typography.fontWeights.bold,
    color: '#4F46E5', // Primary Indigo
  },
  settingsButton: {
    padding: 4,
  },
  scrollContent: {
    paddingTop: 16, // Spacing scale
  },
  // Vitality Gauge styling
  heroSection: {
    alignItems: 'center',
    marginVertical: 16, // Spacing scale
  },
  heroLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1.5,
    marginBottom: 20, // Spacing scale
  },
  gaugeWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeRotateContainer: {
    transform: [{ rotate: '-90deg' }], // Rotate to start drawing from the top
  },
  gaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScoreText: {
    fontFamily: Typography.fontFamily,
    fontSize: 56,
    fontWeight: Typography.fontWeights.bold,
    color: '#16A34A', // Success Green
    lineHeight: 64,
  },
  gaugeStatusText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: Typography.fontWeights.semibold,
    letterSpacing: 1,
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4, // Spacing scale
    paddingHorizontal: 8, // Spacing scale
    borderRadius: 12,
    borderWidth: 1,
  },
  floatingBadgeLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  floatingBadgeDark: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  badgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: 10,
    fontWeight: Typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  badgeLiquidity: {
    right: 8,
    top: 24,
  },
  badgeDebt: {
    left: 8,
    bottom: 24,
  },
  // Masonry Grid styling
  masonryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24, // Spacing scale
    gap: 16, // Spacing scale
    marginTop: 24, // Spacing scale
  },
  masonryColumn: {
    flex: 1,
    gap: 16, // Spacing scale
  },
  glassContainer: {
    borderRadius: 24, // Spacing scale
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassContainerLight: {
    borderColor: 'rgba(135, 135, 135, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  glassContainerDark: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  cardPadding: {
    padding: 16, // Spacing scale
    flex: 1,
  },
  anomalyCard: {
    height: 220, // Mathematically aligns with right column (102 + 102 + 16 gap)
  },
  anomalyGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    left: -10,
    top: -10,
    opacity: 0.8,
  },
  alertHeader: {
    marginBottom: 16,
  },
  cardTitleText: {
    fontFamily: Typography.fontFamily,
    fontSize: 18,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: 8,
  },
  cardDescText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: Typography.fontWeights.medium,
    lineHeight: 20,
  },
  actionReqText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: Typography.fontWeights.bold,
    color: '#DC2626', // Danger Red
    marginTop: 'auto',
  },
  halfCard: {
    height: 102, // 102 * 2 + 16 = 220 height matching left card
  },
  velocityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitleTextSmall: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: Typography.fontWeights.bold,
  },
  velocityValue: {
    fontFamily: Typography.fontFamily,
    fontSize: 20,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: 4,
  },
  velocitySub: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: Typography.fontWeights.semibold,
    color: '#16A34A', // Success Green
  },
  aiSyncGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    right: -20,
    top: -20,
    opacity: 0.8,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  syncDescText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: Typography.fontWeights.medium,
    lineHeight: 18,
  },
  // Weekly Stats Section styling
  statsSection: {
    marginTop: 24, // Spacing scale
  },
  statsLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingHorizontal: 24, // Spacing scale
    gap: 12, // Spacing scale
    paddingBottom: 8,
  },
  statTile: {
    width: 120,
    height: 120,
    borderRadius: 24, // Match theme style
    borderWidth: 1,
    overflow: 'hidden',
  },
  statTileLight: {
    borderColor: 'rgba(135, 135, 135, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  statTileDark: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  tilePadding: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    fontWeight: Typography.fontWeights.bold,
    flex: 1,
  },
  tileValue: {
    fontFamily: Typography.fontFamily,
    fontSize: 20,
    fontWeight: Typography.fontWeights.bold,
  },
  tileSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    fontWeight: Typography.fontWeights.medium,
  },
})
