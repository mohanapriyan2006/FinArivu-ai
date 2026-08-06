import React, { useEffect, useMemo } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg'
import {
  Bot,
  Calendar,
  Car,
  Home,
  Settings,
  Utensils,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import { CARD_SHADOW } from '@/components/insights/Common'

const AnimatedRect = Animated.createAnimatedComponent(Rect)
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// ==========================================
// 1. CASH FLOW CARD
// ==========================================
interface CashFlowCardProps {
  income: number
  spend: number
  netRunRate: number
}

function CashFlowCard({ income, spend, netRunRate }: CashFlowCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const formatParts = (val: number) => {
    const main = Math.floor(val).toLocaleString()
    const cents = (val % 1).toFixed(2).substring(1) // gets .00 or .50
    return { main, cents }
  }

  const incParts = formatParts(income)
  const spendParts = formatParts(spend)
  const netStr = (netRunRate >= 0 ? '+' : '') + netRunRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>CASH FLOW (30D)</Text>
        <Text style={styles.trendText}>📈 +14.2%</Text>
      </View>

      <View style={styles.cashFlowColumns}>
        <View style={styles.column}>
          <Text style={styles.colLabel}>INCOME</Text>
          <View style={styles.largeValueContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.largeValue}>{incParts.main}</Text>
            <Text style={styles.decimalValue}>{incParts.cents}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.column}>
          <Text style={styles.colLabel}>SPEND</Text>
          <View style={styles.largeValueContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.largeValue}>{spendParts.main}</Text>
            <Text style={styles.decimalValue}>{spendParts.cents}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerLabel}>NET RUN RATE</Text>
        <Text style={styles.footerValue}>{netStr}</Text>
      </View>
    </View>
  )
}

// ==========================================
// 2. VELOCITY CHART CARD
// ==========================================
interface DayData {
  day: string
  value: number
}

function VelocityChartCard() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const maxVal = 1500
  const limitVal = 1000
  const chartHeight = 120
  const baselineY = 130

  const data: DayData[] = [
    { day: 'MON', value: 450 },
    { day: 'TUE', value: 820 },
    { day: 'WED', value: 1150 },
    { day: 'THU', value: 610 },
    { day: 'FRI', value: 950 },
    { day: 'SAT', value: 1320 },
    { day: 'SUN', value: 780 },
  ]

  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 })
  }, [progress])

  const limitY = baselineY - (limitVal / maxVal) * chartHeight

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>SPENDING VELOCITY</Text>
        <View style={styles.datePill}>
          <Calendar size={12} color={colors.textSecondary} style={styles.pillIcon} />
          <Text style={styles.pillText}>This Week</Text>
        </View>
      </View>

      <Text style={styles.chartTitle}>7-Day Analysis</Text>

      <View style={styles.chartContainer}>
        <Svg width="100%" height={160} viewBox="0 0 340 160">
          {/* Dash limit line */}
          <Line
            x1={10}
            y1={limitY}
            x2={260}
            y2={limitY}
            stroke={colors.warning}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          {/* Label next to the limit line */}
          <SvgText
            x={265}
            y={limitY + 3}
            fill={colors.warning}
            fontSize={8}
            fontWeight="700"
            textAnchor="start"
          >
            BUDGET LIMIT
          </SvgText>

          {/* Draw bars */}
          {data.map((item, idx) => {
            const x = 15 + idx * 36
            const targetHeight = (item.value / maxVal) * chartHeight
            const isExceeded = item.value > limitVal
            const fillColor = isExceeded ? colors.warning : colors.primary

            return (
              <G key={item.day}>
                <AnimatedBar
                  x={x}
                  width={16}
                  targetHeight={targetHeight}
                  baselineY={baselineY}
                  fillColor={fillColor}
                  progress={progress}
                />
                {/* Day label */}
                <SvgText
                  x={x + 8}
                  y={baselineY + 16}
                  fill={colors.textTertiary}
                  fontSize={9}
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily={Platform.OS === 'android' ? 'monospace' : 'Courier'}
                >
                  {item.day}
                </SvgText>
              </G>
            )
          })}
        </Svg>
      </View>
    </View>
  )
}

interface AnimatedBarProps {
  x: number
  width: number
  targetHeight: number
  baselineY: number
  fillColor: string
  progress: SharedValue<number>
}

function AnimatedBar({
  x,
  width,
  targetHeight,
  baselineY,
  fillColor,
  progress,
}: AnimatedBarProps) {
  const animatedProps = useAnimatedProps(() => {
    const h = targetHeight * progress.value
    return {
      height: h,
      y: baselineY - h,
    }
  })

  return (
    <AnimatedRect
      x={x}
      width={width}
      rx={4}
      ry={4}
      fill={fillColor}
      animatedProps={animatedProps}
    />
  )
}

// ==========================================
// 3. CORE VECTORS (Budget Tracking)
// ==========================================
interface VectorItem {
  id: string
  title: string
  value: number
  progress: number
  icon: typeof Home
  isWarning?: boolean
}

function VectorProgressBar({ item, delay }: { item: VectorItem; delay: number }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const barWidth = useSharedValue(0)

  useEffect(() => {
    barWidth.value = withDelay(
      delay,
      withSpring(item.progress * 100, { damping: 20, stiffness: 100 })
    )
  }, [barWidth, delay, item.progress])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }))

  const stateColor = item.isWarning ? colors.warning : colors.primary
  const bgOpacity = '15' // 15 = ~8.2% transparency in hex
  const iconBoxBg = stateColor + bgOpacity

  return (
    <View style={styles.vectorRow}>
      <View style={[styles.vectorIconBox, { backgroundColor: iconBoxBg }]}>
        <item.icon size={18} color={stateColor} strokeWidth={2} />
      </View>

      <View style={styles.vectorContent}>
        <View style={styles.vectorHeader}>
          <Text style={[styles.vectorTitle, item.isWarning && { color: colors.warning }]}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.vectorValue,
              item.isWarning && { color: colors.warning },
            ]}
          >
            ${item.value.toLocaleString()}
          </Text>
        </View>

        <View style={styles.vectorTrack}>
          <Animated.View
            style={[
              styles.vectorFill,
              { backgroundColor: stateColor },
              animatedStyle,
            ]}
          />
        </View>
      </View>
    </View>
  )
}

// ==========================================
// 4. TARGET SEQUENCES (Goals)
// ==========================================
interface TargetSequence {
  id: string
  title: string
  current: number
  target: number
  progress: number
}

function TargetSequenceRing({ item }: { item: TargetSequence }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const size = 52
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = useSharedValue(circumference)

  useEffect(() => {
    offset.value = withTiming(circumference * (1 - item.progress), { duration: 1200 })
  }, [circumference, item.progress, offset])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }))

  const percentText = `${Math.round(item.progress * 100)}%`

  return (
    <View style={styles.sequenceCard}>
      <View style={styles.sequenceRingContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Track Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated Fill Circle */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference}, ${circumference}`}
              animatedProps={animatedProps}
            />
          </G>
        </Svg>
        <View style={styles.sequencePercentOverlay}>
          <Text style={styles.sequencePercentText}>{percentText}</Text>
        </View>
      </View>

      <View style={styles.sequenceTextContent}>
        <Text style={styles.sequenceTitle}>{item.title}</Text>
        <Text style={styles.sequenceSubtitle}>
          ${item.current.toLocaleString()} / ${item.target.toLocaleString()}
        </Text>
      </View>
    </View>
  )
}

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
export default function PulseScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const vectorItems: VectorItem[] = [
    {
      id: '1',
      title: 'Housing',
      value: 3200,
      progress: 0.8,
      icon: Home,
    },
    {
      id: '2',
      title: 'Dining (Warning)',
      value: 1450,
      progress: 0.95,
      icon: Utensils,
      isWarning: true,
    },
    {
      id: '3',
      title: 'Transport',
      value: 450,
      progress: 0.3,
      icon: Car,
    },
  ]

  const sequenceItems: TargetSequence[] = [
    {
      id: '1',
      title: 'Emergency Fund',
      current: 15000,
      target: 25000,
      progress: 0.65,
    },
    {
      id: '2',
      title: 'Q3 Tax Reserve',
      current: 8000,
      target: 25000,
      progress: 0.32,
    },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Bot size={20} color={colors.primary} strokeWidth={2.5} />
        </View>
        <Text style={styles.headerTitle}>Cognitive Finance</Text>
        <Pressable style={styles.settingsButton} accessibilityRole="button">
          <Settings size={20} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. CASH FLOW (30D) Card */}
        <CashFlowCard income={12450.0} spend={8124.5} netRunRate={4325.5} />

        {/* 3. SPENDING VELOCITY Card */}
        <VelocityChartCard />

        {/* 4. CORE VECTORS (Budget Tracking) Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderOnlyTitle}>CORE VECTORS</Text>
          <View style={styles.vectorList}>
            {vectorItems.map((item, idx) => (
              <VectorProgressBar key={item.id} item={item} delay={idx * 150} />
            ))}
          </View>
        </View>

        {/* 5. TARGET SEQUENCES (Goals) Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderOnlyTitle}>TARGET SEQUENCES</Text>
          <View style={styles.sequenceList}>
            {sequenceItems.map((item) => (
              <TargetSequenceRing key={item.id} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// STYLES
// ==========================================
function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    avatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    settingsButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 16,
    },
    // Card Base
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...CARD_SHADOW,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    cardTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.8,
    },
    cardHeaderOnlyTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 16,
    },
    // Cash Flow Specifics
    trendText: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    cashFlowColumns: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    column: {
      flex: 1,
    },
    colLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: colors.textTertiary,
      marginBottom: 6,
    },
    largeValueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    currencySymbol: {
      fontFamily: Typography.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginRight: 2,
    },
    largeValue: {
      fontFamily: Typography.fontFamily,
      fontSize: 26,
      fontWeight: '700',
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    decimalValue: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginLeft: 1,
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
    },
    footerLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    footerValue: {
      fontFamily: Typography.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    // Velocity Chart Specifics
    datePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillIcon: {
      marginRight: 4,
    },
    pillText: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    chartTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
      marginBottom: 10,
    },
    chartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    // Vector List Specifics
    vectorList: {
      gap: 16,
    },
    vectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vectorIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    vectorContent: {
      flex: 1,
    },
    vectorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    vectorTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    vectorValue: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    vectorTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    vectorFill: {
      height: '100%',
      borderRadius: 3,
    },
    // Target Sequence Ring Specifics
    sequenceList: {
      gap: 12,
    },
    sequenceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      backgroundColor: colors.surface,
    },
    sequenceRingContainer: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    sequencePercentOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sequencePercentText: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    sequenceTextContent: {
      flex: 1,
    },
    sequenceTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sequenceSubtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
  })
}
