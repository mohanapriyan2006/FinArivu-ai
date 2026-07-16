import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  Leaf,
  Lightbulb,
  PiggyBank,
  Plus,
  Sparkles,
  User,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'
import { ProgressRing } from '@/components/financial/ProgressRing'
import { BreakdownRow } from '@/components/financial/BreakdownRow'
import { ActionPlanItem } from '@/components/financial/ActionPlanItem'
import { HealthTrendChart } from '@/components/financial/HealthTrendChart'

interface BreakdownItem {
  label: string
  score: string
  colorKey: 'primary' | 'warning' | 'success'
}

interface ActionItemData {
  icon: LucideIcon
  variant: 'primary' | 'danger' | 'success'
  title: string
  subtitle: string
}

const BREAKDOWN_ROWS: BreakdownItem[] = [
  { label: 'Savings Score', score: '28/30', colorKey: 'primary' },
  { label: 'Emergency Fund', score: '22/25', colorKey: 'warning' },
  { label: 'Debt Ratio', score: '18/20', colorKey: 'success' },
  { label: 'Goal Progress', score: '14/15', colorKey: 'success' },
  { label: 'Budget Discipline', score: '20/25', colorKey: 'warning' },
]

const ACTION_ITEMS: ActionItemData[] = [
  {
    icon: PiggyBank,
    variant: 'primary',
    title: 'Boost emergency fund',
    subtitle: 'Add ₹5,000 this month',
  },
  {
    icon: AlertCircle,
    variant: 'danger',
    title: 'Reduce dining out',
    subtitle: '15% over budget last week',
  },
  {
    icon: Leaf,
    variant: 'success',
    title: 'Invest in SIP',
    subtitle: 'Stay consistent with Nifty 50',
  },
]

export default function FinancialHealthScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const styles = useMemo(() => makeStyles(colors, isDark, insets), [colors, isDark, insets])
  const chartWidth = width - 88

  const handleFabPress = () => {
    navigation.navigate('QuickAddExpense')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.headerTitle}>Financial Health</Text>
          <Pressable
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={24} color={colors.primary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <ArrowUpRight size={12} color={colors.surface} strokeWidth={2.5} />
            <Text style={styles.heroBadgeText}>+4 pts</Text>
          </View>

          <View style={styles.heroScoreWrapper}>
            <ProgressRing
              size={170}
              strokeWidth={16}
              progress={0.84}
              value="84"
              status="EXCELLENT"
            />
          </View>

          <Text style={styles.heroFootnote}>
            Your financial health is in the{' '}
            <Text style={styles.heroHighlight}>top 5%</Text> of users like you.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIconBox}>
              <Sparkles size={20} color={colors.accent} strokeWidth={2} />
            </View>
            <Text style={styles.insightTitle}>Why Your Score Improved</Text>
          </View>
          <Text style={styles.insightBody}>
            You saved 18% more this month and kept all discretionary spends under
            budget. That discipline pushed your score into the excellent range.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
          </View>
          {BREAKDOWN_ROWS.map((row) => (
            <BreakdownRow
              key={row.label}
              label={row.label}
              score={row.score}
              colorKey={row.colorKey}
            />
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={20} color={colors.warning} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Action Plan</Text>
          </View>
          {ACTION_ITEMS.map((item) => (
            <ActionPlanItem
              key={item.title}
              icon={item.icon}
              variant={item.variant}
              title={item.title}
              subtitle={item.subtitle}
            />
          ))}
          <View style={styles.quoteBox}>
            <BookOpen size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.quoteText}>
              “Small consistent actions build lasting wealth.”
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>12-Month Health Trend</Text>
          <HealthTrendChart width={chartWidth} height={140} />
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Take your wealth further</Text>
          <Text style={styles.ctaBody}>
            Discover tax-smart strategies and SIP frameworks tailored to your
            salary.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaButtonText}>Learn Wealth Strategies</Text>
            <ChevronRight size={18} color={colors.primaryDark} strokeWidth={2.5} />
          </Pressable>
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={handleFabPress}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Plus size={28} color={colors.surface} strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors, isDark: boolean, insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 8,
      gap: 24,
      paddingBottom: insets.bottom + 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      shadowColor: isDark ? colors.shadowColor : colors.textPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 10,
      elevation: isDark ? 8 : 2,
    },
    heroBadge: {
      position: 'absolute',
      top: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 2,
    },
    heroBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
    heroScoreWrapper: {
      marginVertical: 20,
    },
    heroFootnote: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    heroHighlight: {
      color: colors.success,
      fontWeight: Typography.fontWeights.bold,
    },
    insightCard: {
      backgroundColor: colors.accentBackground,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
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
      backgroundColor: colors.surface,
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
    insightBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginTop: 12,
      lineHeight: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      shadowColor: isDark ? colors.shadowColor : colors.textPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 10,
      elevation: isDark ? 8 : 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    quoteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.accentBackground,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
    },
    quoteText: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontStyle: 'italic',
      color: colors.textSecondary,
    },
    ctaCard: {
      backgroundColor: colors.heroCard,
      borderRadius: 24,
      padding: 24,
    },
    ctaTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.surface,
    },
    ctaBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.surface,
      opacity: 0.85,
      marginTop: 8,
      lineHeight: 22,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderRadius: 18,
      paddingVertical: 14,
      marginTop: 20,
      gap: 6,
    },
    ctaButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    ctaButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primaryDark,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: insets.bottom + 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryDark,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: isDark ? colors.shadowColor : colors.textPrimary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 10,
      elevation: 8,
    },
    fabPressed: {
      transform: [{ scale: 0.95 }],
    },
  })
