import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Compass,
  HeartPulse,
  Home,
  PieChart,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

// ==========================================
// 1. HEALTH ARTIFACT CARD
// ==========================================
export interface HealthArtifactData {
  overallScore: number
  savingsScore?: number
  emergencyScore?: number
  debtScore?: number
  goalScore?: number
  budgetScore?: number
  status?: string
}

export function HealthArtifactCard({ data }: { data: HealthArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const score = data.overallScore ?? 0
  const statusText = data.status || (score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work')
  const statusColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.danger

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(91, 78, 250, 0.12)' }]}>
          <HeartPulse size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Financial Health Score</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreMax}>/ 100</Text>
        </View>
        <Text style={styles.heroSubtext}>Calculated across 5 deterministic financial engines</Text>
      </View>

      {/* Progress Bars */}
      <View style={styles.breakdownList}>
        <View style={styles.barItem}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Savings Rate</Text>
            <Text style={styles.barScore}>{data.savingsScore ?? 0}/30</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${((data.savingsScore ?? 0) / 30) * 100}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={styles.barItem}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Emergency Fund</Text>
            <Text style={styles.barScore}>{data.emergencyScore ?? 0}/20</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${((data.emergencyScore ?? 0) / 20) * 100}%`, backgroundColor: colors.secondary }]} />
          </View>
        </View>

        <View style={styles.barItem}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Debt Ratio</Text>
            <Text style={styles.barScore}>{data.debtScore ?? 0}/20</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${((data.debtScore ?? 0) / 20) * 100}%`, backgroundColor: colors.success }]} />
          </View>
        </View>
      </View>

      <Pressable style={styles.actionBtn} accessibilityRole="button">
        <Text style={styles.actionBtnText}>View Full Breakdown</Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </Animated.View>
  )
}

// ==========================================
// 2. BUDGET ARTIFACT CARD
// ==========================================
export interface BudgetArtifactData {
  totalBudget?: number
  totalSpent?: number
  overspendCategory?: string
  overspendAmount?: number
  overspendPercentage?: number
}

export function BudgetArtifactCard({ data }: { data: BudgetArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const category = data.overspendCategory ?? '—'
  const spent = data.overspendAmount ?? 0
  const pct = data.overspendPercentage ?? 0
  const statusText = pct > 0 ? 'Over Budget' : 'On Track'
  const statusColor = pct > 0 ? colors.danger : colors.success

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
          <PieChart size={16} color={colors.danger} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Budget Highlight</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{category}</Text>
          <Text style={styles.itemValue}>₹{spent.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.trendPill}>
          <TrendingUp size={12} color={colors.danger} strokeWidth={2.5} />
          <Text style={styles.trendText}>▲ {pct}%</Text>
        </View>
      </View>

      <Text style={styles.noteText}>
        {pct > 0
          ? `Overspent by ₹${spent.toLocaleString('en-IN')} (${pct}%) in ${category}`
          : `No overspending in ${category}`}
      </Text>

      <Pressable style={styles.actionBtn} accessibilityRole="button">
        <Text style={styles.actionBtnText}>Adjust Category Budget</Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </Animated.View>
  )
}

// ==========================================
// 3. GOAL ARTIFACT CARD
// ==========================================
export interface GoalArtifactData {
  goalName?: string
  progressPercentage?: number
  targetAmount?: number
  currentAmount?: number
  monthlyRequired?: number
  status?: string
}

export function GoalArtifactCard({ data }: { data: GoalArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const name = data.goalName ?? '—'
  const pct = data.progressPercentage ?? 0
  const monthly = data.monthlyRequired ?? 0
  const rawStatus = data.status ?? '—'
  const statusColor =
    rawStatus === 'behind' || rawStatus === 'at_risk'
      ? colors.danger
      : rawStatus === 'on_track'
      ? colors.success
      : colors.warning
  const statusText =
    typeof rawStatus === 'string' && rawStatus !== '—'
      ? rawStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : '—'

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
          <Home size={16} color={colors.success} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.goalProgressSection}>
        <View style={styles.progressHeaderRow}>
          <Text style={[styles.progressPctText, { color: statusColor }]}>{pct}%</Text>
          <Text style={styles.progressLabel}>Completed</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
        </View>
      </View>

      <View style={styles.recommendationBox}>
        <Sparkles size={14} color={colors.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.recommendationLabel}>RECOMMENDED MONTHLY SAVINGS</Text>
          <Text style={styles.recommendationValue}>₹{monthly.toLocaleString('en-IN')} / month</Text>
        </View>
      </View>

      <Pressable style={styles.actionBtn} accessibilityRole="button">
        <Text style={styles.actionBtnText}>Set Auto-Transfer</Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </Animated.View>
  )
}

// ==========================================
// 4. TAX ARTIFACT CARD
// ==========================================
export interface TaxArtifactData {
  oldRegimeTax?: number
  newRegimeTax?: number
  savings?: number
  betterRegime?: string
}

export function TaxArtifactCard({ data }: { data: TaxArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const oldTax = data.oldRegimeTax ?? 0
  const newTax = data.newRegimeTax ?? 0
  const savings = data.savings ?? Math.abs(oldTax - newTax)

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
          <Receipt size={16} color={colors.secondary} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Tax Intelligence Comparison</Text>
      </View>

      <View style={styles.regimeComparisonRow}>
        {/* Old Regime */}
        <View style={styles.regimeBox}>
          <Text style={styles.regimeTitle}>Old Regime</Text>
          <Text style={styles.regimeAmount}>₹{oldTax.toLocaleString('en-IN')}</Text>
          <Text style={styles.regimeSubtext}>With 80C & HRA</Text>
        </View>

        {/* Divider */}
        <View style={styles.vsDivider}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* New Regime */}
        <View style={[styles.regimeBox, styles.regimeBoxHighlight]}>
          <Text style={styles.regimeTitleHighlight}>New Regime</Text>
          <Text style={styles.regimeAmountHighlight}>₹{newTax.toLocaleString('en-IN')}</Text>
          <Text style={styles.regimeSubtextHighlight}>Lower Slab Rates</Text>
        </View>
      </View>

      {/* Savings Callout Banner */}
      <View style={styles.savingsBanner}>
        <CheckCircle2 size={16} color={colors.success} strokeWidth={2.5} />
        <Text style={styles.savingsBannerText}>
          Save ₹{savings.toLocaleString('en-IN')} by choosing the New Tax Regime!
        </Text>
      </View>

      <Pressable style={styles.actionBtn} accessibilityRole="button">
        <Text style={styles.actionBtnText}>View Detailed Deductions</Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </Animated.View>
  )
}

// ==========================================
// 5. RETIREMENT ARTIFACT CARD
// ==========================================
export interface RetirementArtifactData {
  corpusRequired?: number
  yearsRemaining?: number
  futureMonthlyExpense?: number
}

export function RetirementArtifactCard({ data }: { data: RetirementArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const corpus = data.corpusRequired ?? 0
  const years = data.yearsRemaining ?? 0
  const futureExp = data.futureMonthlyExpense ?? 0

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
          <Compass size={16} color="#8B5CF6" strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Retirement Corpus Projection</Text>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>TARGET RETIREMENT CORPUS</Text>
        <Text style={styles.heroValue}>₹{(corpus / 10000000).toFixed(2)} Cr</Text>
        <Text style={styles.heroSubtext}>Based on 4% safe withdrawal rate over 25+ years</Text>
      </View>

      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Years to Retirement</Text>
          <Text style={styles.breakdownValue}>{years} Years</Text>
        </View>
        <View style={[styles.breakdownRow, { marginTop: 8 }]}>
          <Text style={styles.breakdownLabel}>Future Monthly Expense (6% Inf.)</Text>
          <Text style={styles.breakdownValue}>₹{futureExp.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <Pressable style={styles.actionBtn} accessibilityRole="button">
        <Text style={styles.actionBtnText}>Simulate Wealth Strategy</Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </Animated.View>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      marginVertical: 10,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    iconBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...Typography.titleMedium,
      color: colors.textHero,
      fontWeight: '700',
      fontSize: 15,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    statusText: {
      ...Typography.labelSmall,
      fontWeight: '700',
      fontSize: 11,
    },
    heroSection: {
      marginBottom: 14,
    },
    heroLabel: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontWeight: '700',
      fontSize: 10,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    heroValue: {
      ...Typography.displayMedium,
      color: colors.primary,
      fontWeight: '800',
      fontSize: 26,
    },
    heroSubtext: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 2,
      fontSize: 12,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    scoreValue: {
      ...Typography.displayMedium,
      color: colors.textHero,
      fontWeight: '800',
      fontSize: 32,
    },
    scoreMax: {
      ...Typography.titleMedium,
      color: colors.textSecondary,
      fontSize: 16,
    },
    breakdownList: {
      gap: 10,
      marginBottom: 16,
    },
    barItem: {
      gap: 4,
    },
    barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    barLabel: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
    },
    barScore: {
      ...Typography.labelSmall,
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 12,
    },
    barTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    itemInfo: {},
    itemName: {
      ...Typography.titleMedium,
      color: colors.textHero,
      fontWeight: '700',
      fontSize: 16,
    },
    itemValue: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 13,
    },
    trendPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(244, 63, 94, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    trendText: {
      ...Typography.labelSmall,
      color: colors.danger,
      fontWeight: '700',
      fontSize: 11,
    },
    noteText: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      marginBottom: 14,
    },
    goalProgressSection: {
      marginBottom: 14,
    },
    progressHeaderRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      marginBottom: 6,
    },
    progressPctText: {
      ...Typography.titleLarge,
      color: colors.success,
      fontWeight: '800',
      fontSize: 22,
    },
    progressLabel: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
    },
    recommendationBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.primarySoft,
      padding: 12,
      borderRadius: 12,
      gap: 10,
      marginBottom: 14,
    },
    recommendationLabel: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontWeight: '700',
      fontSize: 10,
      letterSpacing: 0.5,
    },
    recommendationValue: {
      ...Typography.titleMedium,
      color: colors.textHero,
      fontWeight: '700',
      fontSize: 14,
      marginTop: 2,
    },
    regimeComparisonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    regimeBox: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    regimeBoxHighlight: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    regimeTitle: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
    },
    regimeTitleHighlight: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontWeight: '700',
      fontSize: 11,
    },
    regimeAmount: {
      ...Typography.titleMedium,
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 16,
      marginTop: 2,
    },
    regimeAmountHighlight: {
      ...Typography.titleMedium,
      color: colors.primary,
      fontWeight: '800',
      fontSize: 16,
      marginTop: 2,
    },
    regimeSubtext: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 2,
    },
    regimeSubtextHighlight: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontSize: 10,
      marginTop: 2,
    },
    vsDivider: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vsText: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 10,
    },
    savingsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 8,
      marginBottom: 14,
    },
    savingsBannerText: {
      ...Typography.bodySmall,
      color: colors.success,
      fontWeight: '700',
      fontSize: 12,
      flex: 1,
    },
    breakdownContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    breakdownLabel: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
    },
    breakdownValue: {
      ...Typography.labelMedium,
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 12,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 6,
    },
    actionBtnText: {
      ...Typography.labelMedium,
      color: colors.primary,
      fontWeight: '700',
      fontSize: 13,
    },
  })
