import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Compass,
  FileText,
  HeartPulse,
  Home,
  PieChart,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'

/** Loose payload shape — fields are read defensively from canonical backend data. */
export type ArtifactPayload = Record<string, unknown>

// ==========================================
// 1. HEALTH ARTIFACT CARD
// ==========================================
export interface HealthArtifactData extends ArtifactPayload {
  overallScore?: number
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
        <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
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
    </Animated.View>
  )
}

// ==========================================
// 2. BUDGET ARTIFACT CARD
// ==========================================

interface BudgetCategoryRow {
  categoryName?: string
  overspend?: number
  usage?: number
  spent?: number
  budget?: number
}

export interface BudgetArtifactData extends ArtifactPayload {
  totalBudget?: number
  totalSpent?: number
  overallUtilization?: number
  overspendingCategories?: BudgetCategoryRow[]
}

export function BudgetArtifactCard({ data }: { data: BudgetArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const overspending = Array.isArray(data.overspendingCategories)
    ? (data.overspendingCategories as BudgetCategoryRow[])
    : []
  const top = overspending[0]
  const category = top?.categoryName ?? '—'
  const spent = typeof top?.overspend === 'number' ? top.overspend : 0
  const usage = typeof top?.usage === 'number' ? top.usage : 0
  const pct = Math.max(0, Math.round(usage - 100))
  const overBudget = spent > 0
  const noBudgets = !overBudget && !(data.totalBudget && data.totalBudget > 0)
  const statusText = noBudgets ? 'No Budgets' : overBudget ? 'Over Budget' : 'On Track'
  const statusColor = overBudget ? colors.danger : colors.success

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.dangerTint }]}>
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

        {overBudget && (
          <View style={styles.trendPill}>
            <TrendingUp size={12} color={colors.danger} strokeWidth={2.5} />
            <Text style={styles.trendText}>▲ {pct}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.noteText}>
        {noBudgets
          ? `No budgets set yet — spent ₹${(data.totalSpent ?? 0).toLocaleString('en-IN')} this period. Ask me to create one.`
          : overBudget
            ? `Overspent by ₹${spent.toLocaleString('en-IN')} in ${category}`
            : `Spent ₹${(data.totalSpent ?? 0).toLocaleString('en-IN')} of ₹${(data.totalBudget ?? 0).toLocaleString('en-IN')} budgeted`}
      </Text>
    </Animated.View>
  )
}

// ==========================================
// 3. GOAL ARTIFACT CARD
// ==========================================

interface GoalProjectionRow {
  goalId?: string
  monthlyContribution?: number
  completionPercentage?: number
  status?: string
}

export interface GoalArtifactData extends ArtifactPayload {
  goals?: GoalProjectionRow[]
}

export function GoalArtifactCard({ data, title }: { data: GoalArtifactData; title?: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const goals = Array.isArray(data.goals) ? (data.goals as GoalProjectionRow[]) : []
  const first = goals[0] ?? {}
  const name = title ?? 'Goal Projections'
  const pct = Math.round(first.completionPercentage ?? 0)
  const monthly = first.monthlyContribution ?? 0
  const rawStatus = first.status ?? '—'
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
        <View style={[styles.iconBadge, { backgroundColor: colors.successBackground }]}>
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
          <Text style={styles.recommendationLabel}>REQUIRED MONTHLY CONTRIBUTION</Text>
          <Text style={styles.recommendationValue}>₹{monthly.toLocaleString('en-IN')} / month</Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ==========================================
// 4. TAX ARTIFACT CARD
// ==========================================
export interface TaxArtifactData extends ArtifactPayload {
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
  const betterRegime = data.betterRegime === 'old' ? 'Old' : 'New'

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.chartMuted }]}>
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
      {savings > 0 && (
        <View style={styles.savingsBanner}>
          <CheckCircle2 size={16} color={colors.success} strokeWidth={2.5} />
          <Text style={styles.savingsBannerText}>
            Save ₹{savings.toLocaleString('en-IN')} by choosing the {betterRegime} Tax Regime!
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

// ==========================================
// 5. RETIREMENT ARTIFACT CARD
// ==========================================
export interface RetirementArtifactData extends ArtifactPayload {
  retirementCorpus?: number
  yearsToRetirement?: number
  futureMonthlyExpenses?: number
  inflationRate?: number
  safeWithdrawalRate?: number
}

export function RetirementArtifactCard({ data }: { data: RetirementArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const corpus = data.retirementCorpus ?? 0
  const years = data.yearsToRetirement ?? 0
  const futureExp = data.futureMonthlyExpenses ?? 0
  const withdrawalPct = Math.round((data.safeWithdrawalRate ?? 0) * 1000) / 10
  const inflationPct = Math.round((data.inflationRate ?? 0) * 1000) / 10

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
          <Compass size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Retirement Corpus Projection</Text>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>TARGET RETIREMENT CORPUS</Text>
        <Text style={styles.heroValue}>₹{(corpus / 10000000).toFixed(2)} Cr</Text>
        <Text style={styles.heroSubtext}>
          Based on {withdrawalPct}% safe withdrawal rate
        </Text>
      </View>

      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Years to Retirement</Text>
          <Text style={styles.breakdownValue}>{years} Years</Text>
        </View>
        <View style={[styles.breakdownRow, { marginTop: 8 }]}>
          <Text style={styles.breakdownLabel}>
            Future Monthly Expense ({inflationPct}% Inf.)
          </Text>
          <Text style={styles.breakdownValue}>₹{futureExp.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ==========================================
// 6. NET WORTH ARTIFACT CARD
// ==========================================
export interface NetWorthArtifactData extends ArtifactPayload {
  netWorth?: number
  totalAssets?: number
  totalLiabilities?: number
}

export function NetWorthArtifactCard({ data }: { data: NetWorthArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const netWorth = data.netWorth ?? 0
  const assets = data.totalAssets ?? 0
  const liabilities = data.totalLiabilities ?? 0

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
          <Wallet size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Net Worth Snapshot</Text>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>TOTAL NET WORTH</Text>
        <Text style={styles.heroValue}>₹{netWorth.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Total Assets</Text>
          <Text style={styles.breakdownValue}>₹{assets.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.breakdownRow, { marginTop: 8 }]}>
          <Text style={styles.breakdownLabel}>Total Liabilities</Text>
          <Text style={styles.breakdownValue}>₹{liabilities.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ==========================================
// 7. CASH FLOW ARTIFACT CARD
// ==========================================
export interface CashFlowArtifactData extends ArtifactPayload {
  netCashFlow?: number
  runwayMonths?: number | null
  savingsRate?: number
  currentBalance?: number
}

export function CashFlowArtifactCard({ data }: { data: CashFlowArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const netFlow = data.netCashFlow ?? 0
  const runway = data.runwayMonths
  const savingsPct = Math.round((data.savingsRate ?? 0) * 100)
  const positive = netFlow >= 0
  const statusColor = positive ? colors.success : colors.danger

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
          <Activity size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Cash Flow Snapshot</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {positive ? 'Surplus' : 'Deficit'}
          </Text>
        </View>
      </View>

      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Net Monthly Cash Flow</Text>
          <Text style={[styles.breakdownValue, { color: statusColor }]}>
            {positive ? '+' : ''}₹{netFlow.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.breakdownRow, { marginTop: 8 }]}>
          <Text style={styles.breakdownLabel}>Savings Rate</Text>
          <Text style={styles.breakdownValue}>{savingsPct}%</Text>
        </View>
        {typeof runway === 'number' && (
          <View style={[styles.breakdownRow, { marginTop: 8 }]}>
            <Text style={styles.breakdownLabel}>Cash Runway</Text>
            <Text style={styles.breakdownValue}>{runway.toFixed(1)} months</Text>
          </View>
        )}
      </View>
    </Animated.View>
  )
}

// ==========================================
// 8. INSIGHT ARTIFACT CARD
// ==========================================
export interface InsightArtifactData extends ArtifactPayload {
  insights?: string[]
}

export function InsightArtifactCard({
  data,
  title,
}: {
  data: InsightArtifactData
  title?: string
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const insights = Array.isArray(data.insights)
    ? data.insights.filter((i): i is string => typeof i === 'string')
    : []
  if (insights.length === 0) return null

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.accentBackground }]}>
          <Sparkles size={16} color={colors.accent} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>{title ?? 'Insights'}</Text>
      </View>
      {insights.map((insight, idx) => (
        <View key={`ins-${idx}`} style={styles.insightRow}>
          <AlertTriangle size={13} color={colors.warning} strokeWidth={2.2} />
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      ))}
    </Animated.View>
  )
}

// ==========================================
// 9. REPORT ARTIFACT CARD
// ==========================================

interface ReportSectionItem {
  label?: string
  value?: string
}

interface ReportSection {
  title?: string
  items?: ReportSectionItem[]
  highlight?: string
}

export interface ReportArtifactData extends ArtifactPayload {
  weekStart?: string
  weekEnd?: string
  totalSpent?: number
  totalIncome?: number
  netFlow?: number
  sections?: ReportSection[]
}

export function ReportArtifactCard({ data }: { data: ReportArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const netFlow = data.netFlow ?? 0
  const sections = Array.isArray(data.sections) ? (data.sections as ReportSection[]) : []

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
          <FileText size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Weekly Report</Text>
      </View>

      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Income</Text>
          <Text style={styles.breakdownValue}>
            ₹{(data.totalIncome ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.breakdownRow, { marginTop: 8 }]}>
          <Text style={styles.breakdownLabel}>Spent</Text>
          <Text style={styles.breakdownValue}>
            ₹{(data.totalSpent ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.breakdownRow, { marginTop: 8 }]}>
          <Text style={styles.breakdownLabel}>Net Flow</Text>
          <Text
            style={[
              styles.breakdownValue,
              { color: netFlow >= 0 ? colors.success : colors.danger },
            ]}
          >
            {netFlow >= 0 ? '+' : ''}₹{netFlow.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {sections.slice(0, 3).map(
        (section, idx) =>
          section.highlight ? (
            <Text key={`sec-${idx}`} style={styles.sectionHighlight}>
              {section.title ? `${section.title}: ` : ''}
              {section.highlight}
            </Text>
          ) : null
      )}
    </Animated.View>
  )
}

const makeStyles = (colors: ThemeColors) =>
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
      backgroundColor: colors.dangerTint,
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
      backgroundColor: colors.successBackground,
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
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 6,
    },
    insightText: {
      ...Typography.bodySmall,
      color: colors.textPrimary,
      fontSize: 12,
      lineHeight: 17,
      flex: 1,
    },
    sectionHighlight: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
  })
