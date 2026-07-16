import React, { useMemo, useState } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Svg, Path, Line, Circle, Text as SvgText } from 'react-native-svg'
import {
  Banknote,
  Building,
  ChevronRight,
  Landmark,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { CARD_SHADOW, IconBadge, ListRow, PillBadge, ScreenHeader } from '@/components/insights/Common'

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
const NET_WORTH_DATA = [8.2, 8.6, 9.1, 9.5, 10.1, 10.6, 11.0, 11.3, 11.7, 12.0, 12.4, 12.8]

const ASSETS = [
  { icon: TrendingUp, title: 'Mutual Funds', value: '₹4.2L', trend: '+8.5%', positive: true, iconColor: '#0A4CC5', bgColor: '#EEF5FF' },
  { icon: Building, title: 'Property', value: '₹6.8L', trend: '+3.2%', positive: true, iconColor: '#7C3AED', bgColor: '#F3E8FF' },
  { icon: TrendingUp, title: 'Stocks', value: '₹1.1L', trend: '-2.1%', positive: false, iconColor: '#16A34A', bgColor: '#DCFCE7' },
  { icon: Banknote, title: 'Gold', value: '₹0.4L', trend: '+5.4%', positive: true, iconColor: '#F59E0B', bgColor: '#FEF3C7' },
  { icon: Building, title: 'Bank', value: '₹1.8L', trend: '+1.2%', positive: true, iconColor: '#0EA5E9', bgColor: '#E0F2FE' },
  { icon: Banknote, title: 'Cash', value: '₹0.3L', trend: '+0.0%', positive: true, iconColor: '#64748B', bgColor: '#F1F5F9' },
]

const LIABILITIES = [
  { icon: Landmark, title: 'Home Loan', value: '₹24,500', subtitle: 'EMI due in 5 days' },
  { icon: Wallet, title: 'Credit Card', value: '₹8,200', subtitle: 'Outstanding this month' },
]

interface Point {
  x: number
  y: number
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

function NetWorthTrendChart() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const [layoutWidth, setLayoutWidth] = useState(0)
  const screenWidth = useMemo(() => Dimensions.get('window').width - 80, [])
  const chartWidth = layoutWidth || screenWidth
  const chartHeight = 160
  const padding = { top: 20, bottom: 30, left: 0, right: 0 }

  const maxValue = useMemo(() => Math.max(...NET_WORTH_DATA) * 1.1, [])

  const points = useMemo<Point[]>(() => {
    if (chartWidth === 0) return []
    return NET_WORTH_DATA.map((value, index) => {
      const x = (index / (NET_WORTH_DATA.length - 1)) * chartWidth
      const y = chartHeight - padding.bottom - (value / maxValue) * (chartHeight - padding.top - padding.bottom)
      return { x, y }
    })
  }, [chartWidth, maxValue])

  const linePath = useMemo(() => buildSmoothPath(points), [points])

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Growth Timeline</Text>
        <Pressable style={styles.togglePill} onPress={() => {}}>
          <Text style={styles.togglePillText}>Last 12 Months</Text>
        </Pressable>
      </View>
      <View style={styles.chartContainer} onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}>
        {chartWidth > 0 && points.length > 0 && (
          <Svg width={chartWidth} height={chartHeight}>
            <Line
              x1={0}
              y1={chartHeight - padding.bottom}
              x2={chartWidth}
              y2={chartHeight - padding.bottom}
              stroke={colors.border}
              strokeWidth={1}
            />
            <Path
              d={linePath}
              stroke={colors.primary}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5} fill={colors.primary} />
            {MONTHS.map((month, index) => (
              <SvgText
                key={index}
                x={(index / (MONTHS.length - 1)) * chartWidth}
                y={chartHeight - 8}
                textAnchor={index === 0 ? 'start' : index === MONTHS.length - 1 ? 'end' : 'middle'}
                fontSize={10}
                fill={colors.textSecondary}
                fontFamily={Typography.fontFamily}
              >
                {month}
              </SvgText>
            ))}
          </Svg>
        )}
      </View>
    </View>
  )
}

interface AssetCardProps {
  icon: LucideIcon
  title: string
  value: string
  trend: string
  positive: boolean
  iconColor: string
  bgColor: string
}

function AssetCard({ icon, title, value, trend, positive, iconColor, bgColor }: AssetCardProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const TrendIcon = positive ? TrendingUp : TrendingDown
  const trendColor = positive ? colors.success : colors.danger

  return (
    <View style={styles.assetCard}>
      <View style={[styles.assetIconBox, { backgroundColor: bgColor }]}>
        <IconBadge icon={icon} color={iconColor} backgroundColor="transparent" size={22} />
      </View>
      <Text style={styles.assetTitle}>{title}</Text>
      <Text style={styles.assetValue}>{value}</Text>
      <View style={styles.assetTrend}>
        <TrendIcon size={12} color={trendColor} strokeWidth={2.5} />
        <Text style={[styles.assetTrendText, { color: trendColor }]}>{trend}</Text>
      </View>
    </View>
  )
}

function HeroNetWorthCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.heroCard}>
      <View style={[styles.watermark, { backgroundColor: colors.primary, opacity: 0.05, top: -40, right: -40 }]} />
      <View style={[styles.watermark, { backgroundColor: colors.accent, opacity: 0.08, bottom: -60, left: -20 }]} />
      <View style={[styles.watermark, { backgroundColor: colors.success, opacity: 0.05, top: 40, left: -40 }]} />
      <View style={styles.heroBadge}>
        <Sparkles size={12} color={colors.accent} strokeWidth={2.5} />
        <Text style={styles.heroBadgeText}>AI Insight</Text>
      </View>
      <Text style={styles.heroLabel}>Total Net Worth</Text>
      <Text style={styles.heroValue}>₹12.8 Lakh</Text>
      <PillBadge label="+11.2% this year" backgroundColor={colors.successBackground} textColor={colors.success} />
    </View>
  )
}

export default function NetWorthScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = makeStyles(colors)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(0).springify()}>
            <ScreenHeader title="Networth Analysis" />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.sectionSpacing}>
            <HeroNetWorthCard />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionSpacing}>
            <NetWorthTrendChart />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionSpacing}>
            <Text style={styles.sectionTitle}>Asset Breakdown</Text>
            <View style={styles.assetGrid}>
              {ASSETS.map((asset, index) => (
                <AssetCard key={index} {...asset} />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.sectionSpacing}>
            <Text style={styles.sectionTitle}>Liabilities</Text>
            {LIABILITIES.map((item, index) => (
              <ListRow
                key={index}
                icon={item.icon}
                iconBackgroundColor={colors.dangerTint}
                iconColor={colors.danger}
                title={item.title}
                subtitle={item.subtitle}
                trailing={item.value}
                trailingColor={colors.danger}
              />
            ))}
          </Animated.View>
        </ScrollView>

        <Pressable
          style={[styles.floatingCta, { bottom: Math.max(insets.bottom, 16) + 20 }]}
          onPress={() => {}}
          accessibilityRole="button"
        >
          <Sparkles size={18} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.floatingCtaText}>Ask AI to Optimize Wealth</Text>
          <ChevronRight size={18} color={colors.surface} strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    sectionSpacing: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },

    // Hero Card
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      overflow: 'hidden',
      position: 'relative',
      ...CARD_SHADOW,
    },
    watermark: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.accentBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
      marginBottom: 16,
    },
    heroBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.accent,
    },
    heroLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    heroValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.heading,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
      marginBottom: 16,
    },

    // Chart
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
    },
    togglePill: {
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    togglePillText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    chartContainer: {
      height: 160,
    },

    // Asset Grid
    assetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    assetCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      width: '48%',
      flexGrow: 1,
      ...CARD_SHADOW,
    },
    assetIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    assetTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    assetValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    assetTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    assetTrendText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
    },

    // Floating CTA
    floatingCta: {
      position: 'absolute',
      left: 20,
      right: 20,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      ...CARD_SHADOW,
    },
    floatingCtaText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
}
