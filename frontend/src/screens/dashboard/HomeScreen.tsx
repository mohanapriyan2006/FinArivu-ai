import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Svg, { Path } from 'react-native-svg'
import type { LucideIcon } from 'lucide-react-native'
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bell,
  PiggyBank,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'

interface Point {
  x: number
  y: number
}

interface SnapshotItemData {
  type: string
  amount: string
  colorKey: 'success' | 'danger' | 'primary'
  icon: LucideIcon
}

interface GoalData {
  name: string
  progress: number
}

interface TransactionData {
  id: string
  merchant: string
  category: string
  date: string
  amount: number
  icon: LucideIcon
  iconBg: 'primary' | 'border'
}

const HEALTH_SCORE = {
  score: 84,
  total: 100,
  trend: '+4',
  status: 'Excellent',
}

const NET_WORTH = {
  value: '₹12.8 Lakh',
  change: '+8.4%',
  label: 'vs prev. month',
}

const SNAPSHOTS: SnapshotItemData[] = [
  { type: 'INCOME', amount: '₹85,000', colorKey: 'success', icon: Wallet },
  { type: 'EXPENSE', amount: '₹52,000', colorKey: 'danger', icon: Banknote },
  { type: 'SAVINGS', amount: '₹33,000', colorKey: 'primary', icon: PiggyBank },
]

const INSIGHT = {
  title: 'FinArivu Insight',
  body: 'You saved 18% more this month compared to last month. This keeps you on track for your Home Fund goal.',
  action: 'View Insight',
}

const GOALS: GoalData[] = [
  { name: 'House Fund', progress: 0.75 },
  { name: 'Emergency Fund', progress: 0.6 },
  { name: 'Vacation', progress: 0.4 },
]

const TRANSACTIONS: TransactionData[] = [
  {
    id: '1',
    merchant: 'Swiggy',
    category: 'Food',
    date: 'Oct 24',
    amount: -320,
    icon: Wallet,
    iconBg: 'primary',
  },
  {
    id: '2',
    merchant: 'Amazon',
    category: 'Shopping',
    date: 'Oct 23',
    amount: -1299,
    icon: Banknote,
    iconBg: 'border',
  },
  {
    id: '3',
    merchant: 'Uber',
    category: 'Transport',
    date: 'Oct 22',
    amount: -180,
    icon: Wallet,
    iconBg: 'primary',
  },
  {
    id: '4',
    merchant: 'Netflix',
    category: 'Entertainment',
    date: 'Oct 21',
    amount: -199,
    icon: Banknote,
    iconBg: 'border',
  },
]

const NET_WORTH_CHART_DATA = [10, 15, 12, 20, 28, 35, 42, 50, 55, 70]
const HERO_WATERMARK_DATA = [20, 40, 30, 55, 45, 70, 60, 80]

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

function getChartPoints(
  data: number[],
  chartWidth: number,
  chartHeight: number,
  padding = 10
): Point[] {
  const min = Math.min(...data) * 0.8
  const max = Math.max(...data) * 1.1
  const range = max - min || 1
  return data.map((value, index) => ({
    x: padding + (index / (data.length - 1)) * (chartWidth - 2 * padding),
    y: chartHeight - padding - ((value - min) / range) * (chartHeight - 2 * padding),
  }))
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const cardWidth = width - 48
  const chartWidth = cardWidth - 40

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <User size={20} color={colors.primary} />
        </View>
        <Text style={styles.welcome}>Welcome !</Text>
      </View>
      <Pressable
        style={styles.bellButton}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Bell size={24} color={colors.primary} />
      </Pressable>
    </View>
  )

  const Watermark = () => {
    const w = 140
    const h = 90
    const padding = 8
    const points = HERO_WATERMARK_DATA.map((value, index) => ({
      x: padding + (index / (HERO_WATERMARK_DATA.length - 1)) * (w - 2 * padding),
      y: h - padding - ((value - 10) / 80) * (h - 2 * padding),
    }))
    const d = buildSmoothPath(points)
    return (
      <View style={styles.heroWatermark}>
        <Svg width={w} height={h}>
          <Path
            d={d}
            stroke="#FFFFFF"
            strokeOpacity={0.1}
            strokeWidth={2}
            fill="none"
          />
        </Svg>
      </View>
    )
  }

  const FinancialHealthCard = () => (
    <View style={styles.heroCard}>
      <Watermark />
      <Text style={styles.heroLabel}>FINANCIAL HEALTH SCORE</Text>
      <View style={styles.heroScoreRow}>
        <Text style={styles.heroScore}>{HEALTH_SCORE.score}/{HEALTH_SCORE.total}</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{HEALTH_SCORE.status}</Text>
        </View>
      </View>
      <View style={styles.heroTrend}>
        <ArrowUpRight size={16} color={isDark ? colors.textPrimary : colors.surface} />
        <Text style={styles.heroTrendText}>{HEALTH_SCORE.trend} from last month</Text>
      </View>
      <Pressable
        style={styles.heroButton}
        onPress={() => navigation.navigate('FinancialHealth')}
        accessibilityRole="button"
        accessibilityLabel="View health score details"
      >
        <Text style={styles.heroButtonText}>View Details</Text>
        <ArrowRight size={16} color={isDark ? colors.textPrimary : colors.primary} />
      </Pressable>
    </View>
  )

  const Chart = ({ chartW, chartH }: { chartW: number; chartH: number }) => {
    const points = getChartPoints(NET_WORTH_CHART_DATA, chartW, chartH, 10)
    const line = buildSmoothPath(points)
    const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${chartH} L ${points[0].x.toFixed(2)} ${chartH} Z`
    return (
      <Svg width={chartW} height={chartH}>
        <Path d={area} fill={colors.primary} fillOpacity={0.1} />
        <Path d={line} stroke={colors.primary} strokeWidth={3} fill="none" />
      </Svg>
    )
  }

  const NetWorthCard = () => (
    <View style={styles.card}>
      <Text style={styles.netWorthLabel}>Net Worth</Text>
      <View style={styles.netWorthRow}>
        <Text style={styles.netWorthValue}>{NET_WORTH.value}</Text>
        <View style={styles.netWorthTrend}>
          <TrendingUp size={14} color={colors.success} />
          <Text style={styles.netWorthTrendText}>{NET_WORTH.change}</Text>
        </View>
      </View>
      <Text style={styles.netWorthTrendLabel}>{NET_WORTH.label}</Text>
      <View style={styles.chartContainer}>
        <Chart chartW={chartWidth} chartH={100} />
      </View>
    </View>
  )

  const SnapshotItem = ({ item }: { item: SnapshotItemData }) => {
    const colorMap = {
      success: colors.success,
      danger: colors.danger,
      primary: colors.primary,
    }
    const bgMap = {
      success: colors.successBackground,
      danger: colors.dangerBackground,
      primary: colors.primaryBackground,
    }
    const color = colorMap[item.colorKey]
    const bg = bgMap[item.colorKey]
    const Icon = item.icon
    return (
      <View style={[styles.snapshotItem, { borderLeftColor: color }]}>
        <View style={styles.snapshotInfo}>
          <Text style={styles.snapshotLabel}>{item.type}</Text>
          <Text style={styles.snapshotAmount}>{item.amount}</Text>
        </View>
        <View style={[styles.snapshotIconContainer, { backgroundColor: bg }]}>
          <Icon size={24} color={color} />
        </View>
      </View>
    )
  }

  const InsightCard = () => (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={styles.insightIconBox}>
          <Sparkles size={20} color={colors.surface} />
        </View>
        <Text style={styles.insightTitle}>{INSIGHT.title}</Text>
        <View style={styles.insightBadge}>
          <Text style={styles.insightBadgeText}>SMART</Text>
        </View>
      </View>
      <Text style={styles.insightBody}>{INSIGHT.body}</Text>
      <Pressable
        style={styles.insightLink}
        accessibilityRole="button"
        accessibilityLabel={INSIGHT.action}
      >
        <Text style={styles.insightLinkText}>{INSIGHT.action}</Text>
        <ArrowUpRight size={16} color={colors.accent} />
      </Pressable>
    </View>
  )

  const GoalRow = ({ name, progress }: GoalData) => (
    <View style={styles.goalRow}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalName}>{name}</Text>
        <Text style={styles.goalPercent}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  )

  const TransactionRow = ({ item }: { item: TransactionData }) => {
    const Icon = item.icon
    const isExpense = item.amount < 0
    const amountText = `₹${Math.abs(item.amount).toLocaleString()}`
    const iconBg = item.iconBg === 'primary' ? colors.primaryBackground : colors.border
    const iconColor =
      isDark || item.iconBg !== 'primary' ? colors.textPrimary : colors.primary
    return (
      <View style={styles.transactionRow}>
        <View style={styles.merchantCell}>
          <View style={[styles.transactionIcon, { backgroundColor: iconBg }]}>
            <Icon size={20} color={iconColor} />
          </View>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionMerchant} numberOfLines={1}>
              {item.merchant}
            </Text>
          </View>
        </View>
        <Text style={[styles.tableCell, styles.transactionCategory, styles.categoryCol]} numberOfLines={1}>
          {item.category}
        </Text>
        <Text style={[styles.tableCell, styles.dateCol]} numberOfLines={1}>
          {item.date}
        </Text>
        <Text
          style={[
            styles.tableCell,
            styles.amountCol,
            isExpense ? styles.transactionAmountExpense : styles.transactionAmountNeutral,
          ]}
          numberOfLines={1}
        >
          {amountText}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        <Header />
        <FinancialHealthCard />
        <NetWorthCard />
        <View style={styles.snapshotList}>
          {SNAPSHOTS.map((s) => (
            <SnapshotItem key={s.type} item={s} />
          ))}
        </View>
        <InsightCard />
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals Preview</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Manage all goals">
              <Text style={styles.link}>MANAGE ALL</Text>
            </Pressable>
          </View>
          {GOALS.map((g) => (
            <GoalRow key={g.name} name={g.name} progress={g.progress} />
          ))}
        </View>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="View all transactions">
              <Text style={styles.link}>VIEW ALL</Text>
            </Pressable>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.merchantCol]}>MERCHANT</Text>
            <Text style={[styles.tableHeaderText, styles.categoryCol]}>CATEGORY</Text>
            <Text style={[styles.tableHeaderText, styles.dateCol]}>DATE</Text>
            <Text style={[styles.tableHeaderText, styles.amountCol]}>AMOUNT</Text>
          </View>
          {TRANSACTIONS.map((t) => (
            <TransactionRow key={t.id} item={t} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 8,
      gap: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcome: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    bellButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCard: {
      backgroundColor: colors.heroCard,
      borderRadius: 24,
      padding: 20,
      overflow: 'hidden',
    },
    heroWatermark: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    heroLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: isDark ? colors.textPrimary : colors.primaryBackground,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroScoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 12,
    },
    heroScore: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.display,
      fontWeight: Typography.fontWeights.bold,
      color: isDark ? colors.textPrimary : colors.surface,
    },
    heroBadge: {
      backgroundColor: colors.success,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    heroBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: isDark ? colors.textPrimary : colors.surface,
    },
    heroTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    heroTrendText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: isDark ? colors.textPrimary : colors.surface,
    },
    heroButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginTop: 20,
      gap: 6,
    },
    heroButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: isDark ? colors.textPrimary : colors.primary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      shadowColor: isDark ? colors.shadowColor : colors.textPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 10,
      elevation: isDark ? 8 : 4,
    },
    netWorthLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    netWorthRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 4,
      gap: 8,
    },
    netWorthValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2.5xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    netWorthTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    netWorthTrendText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.success,
    },
    netWorthTrendLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    chartContainer: {
      marginTop: 16,
      height: 100,
      borderRadius: 16,
      overflow: 'hidden',
    },
    snapshotList: {
      gap: 12,
    },
    snapshotItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderLeftWidth: 4,
      padding: 16,
      shadowColor: isDark ? colors.shadowColor : colors.textPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 10,
      elevation: isDark ? 8 : 4,
    },
    snapshotInfo: {
      justifyContent: 'center',
    },
    snapshotLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    snapshotAmount: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginTop: 4,
    },
    snapshotIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightCard: {
      backgroundColor: colors.accentBackground,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 24,
      padding: 20,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    insightIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightTitle: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    insightBadge: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    insightBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xxs,
      fontWeight: Typography.fontWeights.bold,
      color: colors.accent,
    },
    insightBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginTop: 12,
      lineHeight: 22,
    },
    insightLink: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 4,
    },
    insightLinkText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.accent,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    link: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    goalRow: {
      marginBottom: 16,
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    goalName: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    goalPercent: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 8,
    },
    tableHeaderText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xxs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    merchantCol: {
      flex: 2,
    },
    merchantCell: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryCol: {
      flex: 1,
    },
    dateCol: {
      flex: 1,
    },
    amountCol: {
      flex: 1,
      textAlign: 'right',
    },
    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    transactionMeta: {
      flex: 1,
    },
    transactionMerchant: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    transactionCategory: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    tableCell: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      color: colors.textSecondary,
    },
    transactionDate: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      color: colors.textSecondary,
    },
    transactionAmountExpense: {
      color: colors.danger,
      fontWeight: Typography.fontWeights.semibold,
    },
    transactionAmountNeutral: {
      color: colors.textPrimary,
      fontWeight: Typography.fontWeights.semibold,
    },
  })
}
