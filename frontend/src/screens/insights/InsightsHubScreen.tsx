import React, { useEffect, useMemo, useState } from 'react'
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Svg, Path, Circle, G } from 'react-native-svg'
import { useNavigation, type NavigationProp } from '@react-navigation/native'
import type { RootStackParamList } from '@/types/navigation'
import {
  Bell,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Star,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react-native'

import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

const USER_NAME = 'Alex'
const HEALTH_SCORE = 84
const HEALTH_STATUS = 'EXCELLENT'
const HEALTH_DELTA = '5.2%'
const SAVINGS_RATE = '+18.4%'
const GOAL_VELOCITY = 'Optimal'

const CHART_HEIGHT = 180
const CHART_PADDING = 16
const BAR_GAP = 10
const WEALTH_DATA = [28, 42, 38, 55, 52, 68, 74, 82]
const TREND_DATA = [32, 40, 45, 54, 62, 72, 80, 90]

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 3,
}

interface Point {
  x: number
  y: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

interface CircularScoreProps {
  size?: number
  strokeWidth?: number
  progress: number
  value: string
  status: string
  strokeColor: string
  trackColor: string
  statusColor: string
}

function CircularScore({
  size = 160,
  strokeWidth = 18,
  progress,
  value,
  status,
  strokeColor,
  trackColor,
  statusColor,
}: CircularScoreProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={styles.circularText}>
        <Text style={styles.scoreValue}>{value}</Text>
        <Text style={[styles.scoreStatus, { color: statusColor }]}>{status}</Text>
      </View>
    </View>
  )
}

interface StoryPillProps {
  label: string
  value: string
}

function StoryPill({ label, value }: StoryPillProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  return (
    <View style={styles.storyPill}>
      <Text style={styles.storyPillLabel}>{label}</Text>
      <Text style={styles.storyPillValue}>{value}</Text>
    </View>
  )
}

interface MetricCardProps {
  icon: LucideIcon
  title: string
  value: string
  trend: string
  progress: number
  color: string
  iconBackgroundColor: string
  onPress?: () => void
}

function MetricCard({
  icon: Icon,
  title,
  value,
  trend,
  progress,
  color,
  iconBackgroundColor,
  onPress,
}: MetricCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const content = (
    <>
      <View style={styles.metricHeader}>
        <View
          style={[styles.metricIconWrapper, { backgroundColor: iconBackgroundColor }]}
        >
          <Icon size={20} color={color} strokeWidth={2.5} />
        </View>
        <Text style={[styles.metricTrend, { color }]} numberOfLines={1}>
          {trend}
        </Text>
      </View>
      <Text style={styles.metricTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <View style={styles.metricTrack}>
        <View
          style={[
            styles.metricBar,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.metricCard}>
        {content}
      </Pressable>
    )
  }

  return <View style={styles.metricCard}>{content}</View>
}

interface InsightHeaderProps {
  name: string
}

function InsightHeader({ name }: InsightHeaderProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.headerSection}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <User size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Insights</Text>
        <Pressable
          style={styles.bellButton}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>
      <Text style={styles.greeting}>{`${getGreeting()}, ${name}.`}</Text>
      <Text style={styles.greetingSub}>
        Your finances are moving in the right direction.
      </Text>
    </View>
  )
}

function AIHealthScoreCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.card}>
      <View style={styles.healthBadge}>
        <Sparkles size={12} color={colors.accent} strokeWidth={2.5} />
        <Text style={styles.healthBadgeText}>AI Health Score</Text>
      </View>
      <View style={styles.healthCenter}>
        <CircularScore
          size={160}
          strokeWidth={18}
          progress={HEALTH_SCORE / 100}
          value={`${HEALTH_SCORE}`}
          status={HEALTH_STATUS}
          strokeColor={colors.primary}
          trackColor={colors.border}
          statusColor={colors.success}
        />
      </View>
      <Text style={styles.healthFooter}>
        Your financial resilience has increased by{' '}
        <Text style={[styles.healthHighlight, { color: colors.primary }]}>
          {HEALTH_DELTA}
        </Text>{' '}
        since last audit.
      </Text>
    </View>
  )
}

function FinancialStoryCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <View style={styles.storyIconWrapper}>
          <Lightbulb size={22} color={colors.accent} strokeWidth={2.5} />
        </View>
        <Text style={styles.storyTitle}>Your Financial Story This Month</Text>
      </View>
      <Text style={styles.storyQuote}>
        “You saved 18% more than last month and are progressing steadily toward
        your house goal.”
      </Text>
      <View style={styles.storyFooter}>
        <StoryPill label="Savings Rate" value={SAVINGS_RATE} />
        <StoryPill label="Goal Velocity" value={GOAL_VELOCITY} />
      </View>
    </View>
  )
}

function DeepDiveSection() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>()

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Deep-Dive Insights</Text>
        <Pressable
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('BudgetAnalysis')}
          accessibilityRole="button"
          accessibilityLabel="View all insights"
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color={colors.primary} strokeWidth={2.5} />
        </Pressable>
      </View>
      <View style={styles.metricRow}>
        <MetricCard
          icon={TrendingUp}
          title="Budget Health"
          value="92%"
          trend="↗ 12%"
          progress={0.92}
          color={colors.success}
          iconBackgroundColor={colors.successBackground}
          onPress={() => navigation.navigate('BudgetAnalysis')}
        />
        <MetricCard
          icon={TrendingUp}
          title="Net Worth"
          value="₹14.2L"
          trend="↗ 8.4%"
          progress={0.78}
          color={colors.primary}
          iconBackgroundColor={colors.primaryBackground}
          onPress={() => navigation.navigate('NetWorth')}
        />
        <MetricCard
          icon={TrendingUp}
          title="Tax Efficiency"
          value="88%"
          trend="↗ 5%"
          progress={0.88}
          color={colors.accent}
          iconBackgroundColor={colors.accentBackground}
          onPress={() => navigation.navigate('TaxIntelligence')}
        />
      </View>
    </View>
  )
}

function AIFutureForecastCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()

  return (
    <Pressable
      style={styles.forecastCard}
      onPress={() => navigation.navigate('WeeklyReport')}
      accessibilityRole="button"
      accessibilityLabel="Open weekly report story"
    >
      <View style={styles.forecastIconWrapper}>
        <Sparkles size={22} color={colors.accent} strokeWidth={2.5} />
      </View>
      <Text style={styles.forecastTitle}>AI Future Forecast</Text>
      <Text style={styles.forecastBody}>
        At your current savings rate, you could reach your Emergency Fund goal{' '}
        <Text style={styles.forecastHighlight}>4 months earlier</Text> than
        previously estimated.
      </Text>
      <View style={styles.forecastButton}>
        <Text style={styles.forecastButtonText}>Apply Adjustments</Text>
      </View>
    </Pressable>
  )
}

interface AnimatedBarProps {
  width: number
  targetHeight: number
  color: string
  delay?: number
}

function AnimatedBar({
  width,
  targetHeight,
  color,
  delay = 0,
}: AnimatedBarProps) {
  const height = useSharedValue(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      height.value = withSpring(targetHeight, { damping: 15, stiffness: 150 })
    }, delay)
    return () => clearTimeout(timer)
  }, [targetHeight, delay, height])

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }))

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width,
          backgroundColor: color,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        },
      ]}
    />
  )
}

function WealthAccumulationChart() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [layoutWidth, setLayoutWidth] = useState(0)
  const screenWidth = useMemo(
    () => Dimensions.get('window').width - 40,
    []
  )
  const chartWidth = layoutWidth || screenWidth

  const maxScale = useMemo(
    () => Math.max(...WEALTH_DATA, ...TREND_DATA) * 1.1,
    []
  )

  const barWidth = useMemo(() => {
    const totalGap = (WEALTH_DATA.length - 1) * BAR_GAP
    return Math.max(
      0,
      (chartWidth - 2 * CHART_PADDING - totalGap) / WEALTH_DATA.length
    )
  }, [chartWidth])

  const points = useMemo(() => {
    if (chartWidth === 0) return []
    return TREND_DATA.map((value, index) => {
      const x =
        CHART_PADDING +
        index * (barWidth + BAR_GAP) +
        barWidth / 2
      const y =
        CHART_HEIGHT -
        CHART_PADDING -
        (value / maxScale) * (CHART_HEIGHT - 2 * CHART_PADDING)
      return { x, y }
    })
  }, [chartWidth, barWidth, maxScale])

  const linePath = useMemo(() => buildSmoothPath(points), [points])

  return (
    <View style={styles.chartCard}>
      <Pressable
        style={styles.chartHeader}
        onPress={() => navigation.navigate('WealthSimulator')}
        accessibilityRole="button"
        accessibilityLabel="Open wealth simulator"
      >
        <Text style={styles.chartTitle}>Wealth Accumulation Strategy</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={styles.legendLabel}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendLabel}>AI Optimized</Text>
          </View>
        </View>
      </Pressable>
      <View
        style={styles.chartContainer}
        onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.barsLayer}>
          {WEALTH_DATA.map((value, index) => {
            const targetHeight =
              (value / maxScale) * (CHART_HEIGHT - 2 * CHART_PADDING)
            return (
              <AnimatedBar
                key={index}
                width={barWidth}
                targetHeight={targetHeight}
                color={colors.border}
                delay={index * 100}
              />
            )
          })}
        </View>
        {chartWidth > 0 && points.length > 0 && (
          <Svg
            width={chartWidth}
            height={CHART_HEIGHT}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Path
              d={linePath}
              stroke={colors.accent}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={5}
              fill={colors.accent}
              stroke={colors.surface}
              strokeWidth={2}
            />
          </Svg>
        )}
      </View>
    </View>
  )
}

function TaxEfficiencyCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.taxCard}>
      <View style={styles.taxIconCircle}>
        <Star size={28} color={colors.accent} fill={colors.accent} strokeWidth={2} />
      </View>
      <Text style={styles.taxTitle}>Tax Efficiency Opportunity</Text>
      <Text style={styles.taxBody}>
        You could save approximately ₹42,000 this financial year by optimizing
        your 80C, NPS, and HRA allocations. The recommended strategy is ready to
        execute.
      </Text>
      <Pressable
        style={styles.taxButton}
        onPress={() => {}}
        accessibilityRole="button"
        accessibilityLabel="Execute strategy"
      >
        <Text style={styles.taxButtonText}>Execute Strategy</Text>
      </Pressable>
    </View>
  )
}

export default function InsightsHubScreen() {
  const { colors } = useTheme()
  const { user } = useAuthContext()
  const insets = useSafeAreaInsets()
  const styles = makeStyles(colors)

  const firstName = useMemo(
    () => user?.fullName?.split(' ')[0] ?? USER_NAME,
    [user?.fullName]
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(0).springify()}>
          <InsightHeader name={firstName} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={styles.sectionSpacing}
        >
          <AIHealthScoreCard />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.sectionSpacing}
        >
          <FinancialStoryCard />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.sectionSpacing}
        >
          <DeepDiveSection />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.sectionSpacing}
        >
          <AIFutureForecastCard />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          style={styles.sectionSpacing}
        >
          <WealthAccumulationChart />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={styles.sectionSpacing}
        >
          <TaxEfficiencyCard />
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
    sectionSpacing: {
      marginBottom: 24,
    },

    // Header
    headerSection: {
      marginBottom: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    bellButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    greeting: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.heading,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      lineHeight: 40,
      marginBottom: 8,
    },
    greetingSub: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 24,
    },

    // Shared surface card
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      position: 'relative',
      ...CARD_SHADOW,
    },

    // AI Health Score Card
    healthBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      zIndex: 2,
      gap: 6,
    },
    healthBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.accent,
    },
    healthCenter: {
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 8,
    },
    circularContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    circularText: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.score,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    scoreStatus: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    healthFooter: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    healthHighlight: {
      fontWeight: Typography.fontWeights.bold,
    },

    // Financial Story Card
    storyCard: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 20,
      position: 'relative',
      ...CARD_SHADOW,
    },
    storyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    storyIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
      flex: 1,
    },
    storyQuote: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2.5xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
      lineHeight: 34,
      marginBottom: 24,
    },
    storyFooter: {
      flexDirection: 'row',
      gap: 12,
    },
    storyPill: {
      flex: 1,
      backgroundColor: colors.storyCardInner,
      borderRadius: 16,
      padding: 16,
    },
    storyPillLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.surface,
      opacity: 0.85,
      marginBottom: 4,
    },
    storyPillValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
    },

    // Deep-Dive Insights
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewAllText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    metricRow: {
      flexDirection: 'row',
      gap: 12,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      ...CARD_SHADOW,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    metricIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricTrend: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
    },
    metricTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    metricValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    metricTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    metricBar: {
      height: '100%',
      borderRadius: 3,
    },

    // AI Future Forecast Card
    forecastCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 44,
      paddingBottom: 24,
      alignItems: 'center',
      position: 'relative',
      ...CARD_SHADOW,
    },
    forecastIconWrapper: {
      position: 'absolute',
      top: -24,
      left: '50%',
      marginLeft: -28,
      width: 56,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.accentBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    forecastTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    forecastBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    forecastHighlight: {
      color: colors.primary,
      fontWeight: Typography.fontWeights.bold,
    },
    forecastButton: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    forecastButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },

    // Wealth Accumulation Chart
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      ...CARD_SHADOW,
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    chartTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      flex: 1,
      marginRight: 12,
    },
    legendRow: {
      flexDirection: 'row',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      color: colors.textSecondary,
    },
    chartContainer: {
      height: CHART_HEIGHT,
      position: 'relative',
    },
    barsLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: CHART_PADDING,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: BAR_GAP,
    },

    // Tax Efficiency Card
    taxCard: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 24,
      ...CARD_SHADOW,
    },
    taxIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    taxTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
      marginBottom: 12,
    },
    taxBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.surface,
      lineHeight: 24,
      opacity: 0.9,
      marginBottom: 24,
    },
    taxButton: {
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taxButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
  })
}
