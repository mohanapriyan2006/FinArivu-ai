import React from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Svg, Circle, G } from 'react-native-svg'
import {
  AlertTriangle,
  Car,
  ChevronRight,
  HandCoins,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import {
  CARD_SHADOW,
  IconBadge,
  ListRow,
  MiniCard,
  PillBadge,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
} from '@/components/insights/Common'

const BUDGET_PERCENT = 0.87
const TOTAL_SPEND = '₹42,850'

const SPENDING_SEGMENTS = [
  { label: 'Housing', percent: 35, color: '#0A4CC5' },
  { label: 'Food', percent: 25, color: '#F59E0B' },
  { label: 'Transport', percent: 15, color: '#16A34A' },
  { label: 'Health', percent: 10, color: '#DC2626' },
  { label: 'Others', percent: 15, color: '#94A3B8' },
]

const WEEKLY_SPENDING = [
  { week: 'Week 1', amount: '₹8,400', status: 'Frugal', color: '#0A4CC5' },
  { week: 'Week 2', amount: '₹15,200', status: 'Peak', color: '#DC2626' },
  { week: 'Week 3', amount: '₹10,500', status: 'Normal', color: '#0A4CC5' },
  { week: 'Week 4', amount: '₹8,750', status: 'Optimized', color: '#16A34A' },
]

const ADJUSTMENTS = [
  {
    icon: Car,
    title: 'Transport Optimization',
    subtitle: '3 trips switched to Metro',
    trailing: '+₹450 Saved',
    trailingColor: 'success',
  },
  {
    icon: HandCoins,
    title: 'Lifestyle Subscriptions',
    subtitle: 'Unused gym pass alert',
    trailing: '₹1,200/mo',
    trailingColor: 'secondary',
  },
]

interface DonutSegment {
  label: string
  percent: number
  color: string
}

interface SegmentedDonutChartProps {
  size?: number
  strokeWidth?: number
  segments: DonutSegment[]
  centerLabel: string
  centerValue: string
}

function SegmentedDonutChart({
  size = 220,
  strokeWidth = 40,
  segments,
  centerLabel,
  centerValue,
}: SegmentedDonutChartProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  return (
    <View style={styles.donutContainer}>
      <Svg width={size} height={size} style={styles.donutSvg}>
        {segments.map((segment, index) => {
          const arcLength = (segment.percent / 100) * circumference
          const rotation = -90 + cumulativePercent * 360
          cumulativePercent += segment.percent / 100
          return (
            <G
              key={index}
              rotation={rotation}
              origin={`${size / 2}, ${size / 2}`}
            >
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${arcLength}, ${circumference}`}
                strokeLinecap="butt"
              />
            </G>
          )
        })}
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutCenterLabel}>{centerLabel}</Text>
        <Text style={styles.donutCenterValue}>{centerValue}</Text>
      </View>
    </View>
  )
}

interface LegendItemProps {
  color: string
  label: string
  percent: number
}

function LegendItem({ color, label, percent }: LegendItemProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendPercent}>{percent}%</Text>
    </View>
  )
}

function MonthlyBudgetHealthCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.card}>
      <Text style={styles.budgetLabel}>MONTHLY BUDGET HEALTH</Text>
      <View style={styles.budgetHeader}>
        <Text style={styles.budgetValue}>87% On Track</Text>
        <PillBadge label="Good" backgroundColor={colors.successBackground} textColor={colors.success} />
      </View>
      <ProgressBar
        progress={BUDGET_PERCENT}
        fillColor={colors.primary}
        trackColor={colors.border}
        height={10}
        delay={200}
      />
      <Text style={styles.budgetDescription}>
        You're doing better than 92% of users with similar income goals this month.
      </Text>
    </View>
  )
}

function SpendingEcosystemCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.card}>
      <SectionHeader title="Spending Ecosystem" actionText="View Details >" />
      <SegmentedDonutChart
        segments={SPENDING_SEGMENTS}
        centerLabel="Total Spend"
        centerValue={TOTAL_SPEND}
      />
      <View style={styles.legendGrid}>
        {SPENDING_SEGMENTS.map((segment, index) => (
          <LegendItem key={index} color={segment.color} label={segment.label} percent={segment.percent} />
        ))}
      </View>
    </View>
  )
}

function OverspendingAlertCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <IconBadge icon={AlertTriangle} color={colors.danger} backgroundColor={colors.dangerTint} />
        <View style={styles.alertHeaderText}>
          <Text style={styles.alertTitle}>Overspending Alert</Text>
          <Text style={styles.alertCategory}>Food Spending</Text>
        </View>
      </View>
      <Text style={styles.alertBig}>+22% Above Average</Text>
      <Text style={styles.alertDescription}>
        Your delivery habits on Week 2 spiked significantly compared to last month.
      </Text>
    </View>
  )
}

function AISmartTipCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIconWrapper}>
        <Sparkles size={22} color={colors.accent} strokeWidth={2.5} />
      </View>
      <Text style={styles.tipTitle}>AI Smart Tip</Text>
      <Text style={styles.tipBody}>
        Reducing food delivery spending by ₹1,500 could improve your monthly savings rate by{' '}
        <Text style={[styles.tipHighlight, { color: colors.success }]}>4.2%</Text>.
      </Text>
      <Pressable style={styles.tipButton} onPress={() => {}} accessibilityRole="button">
        <Text style={styles.tipButtonText}>Apply Plan</Text>
      </Pressable>
    </View>
  )
}

function WeeklySpendingJourney() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View>
      <SectionHeader title="Weekly Spending Journey" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weeklyScroll}
      >
        {WEEKLY_SPENDING.map((week, index) => (
          <MiniCard
            key={index}
            topLabel={week.week}
            value={week.amount}
            status={week.status}
            statusColor={week.color}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function NotableAdjustments() {
  const { colors } = useTheme()

  return (
    <View>
      <SectionHeader title="Notable Adjustments" />
      {ADJUSTMENTS.map((item, index) => (
        <ListRow
          key={index}
          icon={item.icon as LucideIcon}
          iconBackgroundColor={item.trailingColor === 'success' ? colors.successBackground : colors.border}
          iconColor={item.trailingColor === 'success' ? colors.success : colors.textSecondary}
          title={item.title}
          subtitle={item.subtitle}
          trailing={item.trailing}
          trailingColor={item.trailingColor === 'success' ? colors.success : colors.textSecondary}
        />
      ))}
    </View>
  )
}

export default function BudgetAnalysisScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = makeStyles(colors)

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
          <ScreenHeader title="Insights" />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.sectionSpacing}>
          <MonthlyBudgetHealthCard />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionSpacing}>
          <SpendingEcosystemCard />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionSpacing}>
          <OverspendingAlertCard />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.sectionSpacing}>
          <AISmartTipCard />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.sectionSpacing}>
          <WeeklySpendingJourney />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.sectionSpacing}>
          <NotableAdjustments />
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      ...CARD_SHADOW,
    },

    // Monthly Budget Health
    budgetLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    budgetValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    budgetDescription: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 20,
      marginTop: 12,
    },

    // Spending Ecosystem
    donutContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    donutSvg: {
      alignSelf: 'center',
    },
    donutCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCenterLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    donutCenterValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginTop: 4,
    },
    legendGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    legendItem: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 8,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textPrimary,
    },
    legendPercent: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
    },

    // Overspending Alert
    alertCard: {
      backgroundColor: colors.dangerTint,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.danger,
      padding: 20,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    alertHeaderText: {
      flex: 1,
    },
    alertTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    alertCategory: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    alertBig: {
      fontFamily: Typography.fontFamily,
      fontSize: 28,
      fontWeight: Typography.fontWeights.bold,
      color: colors.danger,
      marginBottom: 8,
    },
    alertDescription: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 20,
    },

    // AI Smart Tip
    tipCard: {
      backgroundColor: colors.accentBackground,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 44,
      paddingBottom: 24,
      alignItems: 'center',
      position: 'relative',
      ...CARD_SHADOW,
    },
    tipIconWrapper: {
      position: 'absolute',
      top: -24,
      left: '50%',
      marginLeft: -28,
      width: 56,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...CARD_SHADOW,
    },
    tipTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    tipBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    tipHighlight: {
      fontWeight: Typography.fontWeights.bold,
    },
    tipButton: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },

    // Weekly Spending
    weeklyScroll: {
      gap: 12,
      paddingRight: 20,
    },
  })
}
