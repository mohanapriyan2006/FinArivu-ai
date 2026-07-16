import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Svg, G, Polygon, Text as SvgText } from 'react-native-svg'
import {
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { CARD_SHADOW, PillBadge, ProgressBar, ScreenHeader } from '@/components/insights/Common'
import { ProgressRing } from '@/components/financial/ProgressRing'

const TAX_YEAR_OPTIONS = ['FY 2024-25', 'FY 2023-24']

const REGIME_OLD = {
  baseTax: '₹2,45,000',
  deductionBenefit: '-₹1,50,000',
  effectiveTax: '₹95,000',
}

const REGIME_NEW = {
  baseTax: '₹2,05,000',
  standardDeduction: '-₹50,000',
  effectiveTax: '₹1,55,000',
  savings: '₹0',
}

const DEDUCTIONS = [
  { title: '80C (PPF/ELSS)', limit: '₹1,50,000', used: '₹1,50,000', percent: 1.0, status: 'Maxed Out', statusColor: '#16A34A', barColor: '#16A34A' },
  { title: '80D (Health Insurance)', limit: '₹25,000', used: '₹12,000', percent: 0.48, status: 'Action Needed', statusColor: '#DC2626', barColor: '#DC2626' },
  { title: 'NPS (Tier 1)', limit: '₹50,000', used: '₹50,000', percent: 1.0, status: 'Maxed Out', statusColor: '#16A34A', barColor: '#16A34A' },
  { title: 'House Rent Allowance', limit: '₹2,40,000', used: '₹1,80,000', percent: 0.75, status: 'Action Needed', statusColor: '#DC2626', barColor: '#DC2626' },
]

const FUNNEL = [
  { label: 'Gross Income', value: '₹8,50,000', topRatio: 0.94, bottomRatio: 0.78, colorKey: 'primary' as const },
  { label: 'Deductions', value: '₹1,50,000', topRatio: 0.78, bottomRatio: 0.62, colorKey: 'accent' as const },
  { label: 'Taxable Income', value: '₹7,00,000', topRatio: 0.62, bottomRatio: 0.46, colorKey: 'primaryDark' as const },
  { label: 'Tax Due', value: '₹45,000', topRatio: 0.46, bottomRatio: 0.34, colorKey: 'heroCard' as const },
]

interface FunnelBlockProps {
  block: typeof FUNNEL[0]
  fullWidth: number
  y: number
  blockHeight: number
  colors: ThemeColors
}

function FunnelBlock({ block, fullWidth, y, blockHeight, colors }: FunnelBlockProps) {
  const colorMap: Record<string, string> = {
    primary: colors.primary,
    accent: colors.accent,
    primaryDark: colors.primaryDark,
    heroCard: colors.heroCard,
  }
  const color = colorMap[block.colorKey]
  const topWidth = Math.max(40, fullWidth * block.topRatio)
  const bottomWidth = Math.max(40, fullWidth * block.bottomRatio)

  const topLeft = { x: (fullWidth - topWidth) / 2, y }
  const topRight = { x: topLeft.x + topWidth, y }
  const bottomLeft = { x: (fullWidth - bottomWidth) / 2, y: y + blockHeight }
  const bottomRight = { x: bottomLeft.x + bottomWidth, y: y + blockHeight }

  const points = `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`

  return (
    <G>
      <Polygon points={points} fill={color} />
      <SvgText
        x={fullWidth / 2}
        y={y + blockHeight / 2 - 2}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={12}
        fontFamily={Typography.fontFamily}
        fontWeight="600"
      >
        {block.label}
      </SvgText>
      <SvgText
        x={fullWidth / 2}
        y={y + blockHeight / 2 + 14}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={12}
        fontFamily={Typography.fontFamily}
      >
        {block.value}
      </SvgText>
    </G>
  )
}

function InvertedFunnel() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const [layoutWidth, setLayoutWidth] = useState(0)
  const blockHeight = 52
  const gap = 4
  const fullWidth = layoutWidth
  const totalHeight = FUNNEL.length * blockHeight + (FUNNEL.length - 1) * gap + 32

  return (
    <View
      style={styles.funnelContainer}
      onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
    >
      {fullWidth > 0 && (
        <Svg width={fullWidth} height={totalHeight}>
          {FUNNEL.map((block, index) => {
            const y = 16 + index * (blockHeight + gap)
            return (
              <FunnelBlock
                key={index}
                block={block}
                fullWidth={fullWidth}
                y={y}
                blockHeight={blockHeight}
                colors={colors}
              />
            )
          })}
        </Svg>
      )}
    </View>
  )
}

function HeroTaxCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroSavingsLabel}>Potential Tax Savings</Text>
      <Text style={styles.heroSavingsValue}>₹18,500</Text>
      <InvertedFunnel />
    </View>
  )
}

function TaxSavingInsightCard() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={styles.insightIconWrapper}>
          <Sparkles size={20} color={colors.accent} strokeWidth={2.5} />
        </View>
        <Text style={styles.insightTitle}>Tax Saving Insight</Text>
      </View>
      <Text style={styles.insightBody}>
        Your current deduction mix leaves room to save an extra ₹12,000 under the old regime.
      </Text>
      <Pressable onPress={() => {}} style={styles.insightAction}>
        <Text style={styles.insightActionText}>Compare Regimes</Text>
        <ChevronRight size={16} color={colors.accent} strokeWidth={2.5} />
      </Pressable>
    </View>
  )
}

function TaxHealthScore() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreTitle}>Tax Health Score</Text>
      <View style={styles.scoreCenter}>
        <ProgressRing progress={0.72} value="72" status="Excellent" />
      </View>
    </View>
  )
}

interface RegimeRowProps {
  label: string
  value: string
  valueColor?: string
  labelColor?: string
  borderColor?: string
  isLast?: boolean
}

function RegimeRow({ label, value, valueColor, labelColor, borderColor, isLast }: RegimeRowProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  return (
    <View
      style={[
        styles.regimeRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor ?? colors.border },
      ]}
    >
      <Text style={[styles.regimeRowLabel, { color: labelColor ?? colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.regimeRowValue, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
    </View>
  )
}

function RegimeComparison() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const [selectedYear, setSelectedYear] = useState(TAX_YEAR_OPTIONS[0])

  return (
    <View>
      <Text style={styles.sectionTitle}>Regime Comparison</Text>
      <View style={styles.toggleRow}>
        {TAX_YEAR_OPTIONS.map((year) => {
          const active = year === selectedYear
          return (
            <Pressable
              key={year}
              style={[styles.togglePill, active ? styles.togglePillActive : styles.togglePillInactive]}
              onPress={() => setSelectedYear(year)}
            >
              <Text style={[styles.togglePillText, active && styles.togglePillTextActive]}>{year}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.regimeCard}>
        <Text style={styles.regimeName}>Old Regime</Text>
        <RegimeRow label="Base Tax" value={REGIME_OLD.baseTax} />
        <RegimeRow label="Deductions Benefit" value={REGIME_OLD.deductionBenefit} valueColor={colors.success} />
        <RegimeRow label="Effective Tax" value={REGIME_OLD.effectiveTax} isLast />
      </View>

      <View style={styles.regimeCardActive}>
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
        </View>
        <View style={styles.regimeHeader}>
          <Text style={styles.regimeNameActive}>New Regime</Text>
          <PillBadge label="Simplified" backgroundColor={colors.surface} textColor={colors.primary} />
        </View>
        <RegimeRow label="Base Tax" value={REGIME_NEW.baseTax} labelColor={colors.surface} valueColor={colors.surface} borderColor="rgba(255,255,255,0.15)" />
        <RegimeRow label="Standard Deduction" value={REGIME_NEW.standardDeduction} labelColor={colors.surface} valueColor={colors.surface} borderColor="rgba(255,255,255,0.15)" />
        <RegimeRow label="Effective Tax" value={REGIME_NEW.effectiveTax} labelColor={colors.surface} valueColor={colors.surface} borderColor="rgba(255,255,255,0.15)" />
        <RegimeRow label="Savings vs Old" value={REGIME_NEW.savings} labelColor={colors.surface} valueColor={colors.accent} isLast />
      </View>
    </View>
  )
}

interface DeductionRowProps {
  title: string
  limit: string
  used: string
  percent: number
  status: string
  statusColor: string
  barColor: string
}

function DeductionRow({ title, limit, used, percent, status, statusColor, barColor }: DeductionRowProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.deductionCard}>
      <View style={styles.deductionHeader}>
        <View>
          <Text style={styles.deductionTitle}>{title}</Text>
          <Text style={styles.deductionLimit}>Limit {limit} • Used {used}</Text>
        </View>
        <Text style={[styles.deductionStatus, { color: statusColor }]}>{status}</Text>
      </View>
      <ProgressBar progress={percent} fillColor={barColor} trackColor={colors.border} height={8} delay={200} />
    </View>
  )
}

export default function TaxIntelligenceScreen() {
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
          <ScreenHeader title="Tax Intelligence" />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.sectionSpacing}>
          <HeroTaxCard />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionSpacing}>
          <TaxSavingInsightCard />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionSpacing}>
          <TaxHealthScore />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.sectionSpacing}>
          <RegimeComparison />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>Deduction Explorer</Text>
          {DEDUCTIONS.map((deduction, index) => (
            <DeductionRow key={index} {...deduction} />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).springify()}>
          <Pressable style={styles.ctaButton} onPress={() => {}} accessibilityRole="button">
            <Text style={styles.ctaButtonText}>Generate Tax Optimization Report</Text>
          </Pressable>
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
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },

    // Hero Tax Card
    heroCard: {
      backgroundColor: colors.heroCard,
      borderRadius: 24,
      padding: 24,
      ...CARD_SHADOW,
    },
    heroSavingsLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.medium,
      color: colors.surface,
      opacity: 0.9,
      marginBottom: 4,
    },
    heroSavingsValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.heading,
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
      marginBottom: 20,
    },
    funnelContainer: {
      height: 240,
    },

    // Tax Saving Insight
    insightCard: {
      backgroundColor: colors.accentBackground,
      borderRadius: 24,
      padding: 20,
      ...CARD_SHADOW,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    insightIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    insightBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 16,
    },
    insightAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    insightActionText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.accent,
    },

    // Tax Health Score
    scoreCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      ...CARD_SHADOW,
    },
    scoreTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    scoreCenter: {
      alignItems: 'center',
    },

    // Regime Comparison
    toggleRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 4,
      marginBottom: 16,
      ...CARD_SHADOW,
    },
    togglePill: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 20,
    },
    togglePillActive: {
      backgroundColor: colors.primary,
    },
    togglePillInactive: {
      backgroundColor: 'transparent',
    },
    togglePillText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
    },
    togglePillTextActive: {
      color: colors.surface,
    },
    regimeCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
      ...CARD_SHADOW,
    },
    regimeCardActive: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 20,
      position: 'relative',
      ...CARD_SHADOW,
    },
    recommendedBadge: {
      position: 'absolute',
      top: -12,
      right: 16,
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    recommendedBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
    },
    regimeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    regimeName: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    regimeNameActive: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
    },
    regimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    regimeRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    regimeRowLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
    },
    regimeRowValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
    },

    // Deduction Explorer
    deductionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      ...CARD_SHADOW,
    },
    deductionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    deductionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    deductionLimit: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
    deductionStatus: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
    },

    // CTA
    ctaButton: {
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    ctaButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
}
