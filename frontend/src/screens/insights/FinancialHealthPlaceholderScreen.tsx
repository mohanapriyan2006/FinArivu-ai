import React, { useMemo } from 'react'
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
import { ArrowLeft } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { formatInr } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface MetricBarProps {
  label: string
  value: number
  max: number
  color: string
  colors: ThemeColors
}

const barStyles = StyleSheet.create({
  metricRow: {
    marginBottom: 14,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.fontWeights.medium,
  },
  metricValue: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.fontWeights.semibold,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
})

const MetricBar: React.FC<MetricBarProps> = ({ label, value, max, color, colors }) => {
  const { width } = useWindowDimensions()
  const fillWidth = max > 0 ? Math.min(1, Math.max(0, Math.abs(value) / max)) : 0
  return (
    <View style={barStyles.metricRow}>
      <View style={barStyles.metricLabelRow}>
        <Text style={[barStyles.metricLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[barStyles.metricValue, { color: colors.textPrimary }]}>
          {formatInr(value, { fallback: '₹0' })}
        </Text>
      </View>
      <View
        style={[
          barStyles.barTrack,
          { backgroundColor: colors.border ?? 'rgba(0,0,0,0.06)', width: width - 104 },
        ]}
      >
        <View style={[barStyles.barFill, { width: `${fillWidth * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

export default function FinancialHealthPlaceholderScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { profile } = useFinancialProfile()
  const { width } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(colors, width), [colors, width])

  const income = profile.income?.monthlyTakeHome ?? 0
  const expenses = profile.expenses?.totalMonthlyExpenses ?? 0
  const savings = profile.savings?.totalSavings ?? 0
  const investments = profile.investments?.totalInvestmentValue ?? 0
  const loans =
    profile.loans?.loans?.reduce((sum, l) => sum + (l.outstandingAmount ?? 0), 0) ?? 0
  const creditCards = profile.creditCards?.totalOutstanding ?? 0
  const netWorth = savings + investments - loans - creditCards

  const barMax = Math.max(income, expenses, savings, investments, loans, Math.abs(netWorth), 1)

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  const dti = income > 0 ? ((loans + creditCards) / income) * 100 : 0

  const spendingBreakdown = useMemo(() => {
    if (!profile.expenses?.breakdown) return []
    return Object.entries(profile.expenses.breakdown).filter(
      ([, amount]) => typeof amount === 'number' && amount > 0
    ) as [string, number][]
  }, [profile.expenses?.breakdown])

  const goals = useMemo(() => profile.goals?.goals?.slice(0, 5) ?? [], [profile.goals?.goals])

  const hasData =
    income > 0 ||
    expenses > 0 ||
    savings > 0 ||
    investments > 0 ||
    loans > 0 ||
    profile.goals?.goals?.length

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textHero }]}>Financial Health</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <View style={styles.emptyState}>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>
              Complete your profile to see insights.
            </Text>
            <Text style={[styles.copy, { color: colors.textSecondary }]}>
              Add income, expenses, savings, and goals to get a detailed financial health breakdown.
            </Text>
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={[styles.sectionTitle, { color: colors.textHero }]}>Monthly Overview</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MetricBar label="Income" value={income} max={barMax} color="#22C55E" colors={colors} />
              <MetricBar label="Expenses" value={expenses} max={barMax} color="#EF4444" colors={colors} />
              <MetricBar label="Savings" value={savings} max={barMax} color="#3B82F6" colors={colors} />
              <MetricBar label="Investments" value={investments} max={barMax} color="#8B5CF6" colors={colors} />
              <MetricBar label="Loans" value={loans} max={barMax} color="#F97316" colors={colors} />
              <MetricBar label="Net worth" value={netWorth} max={barMax} color="#4F46E5" colors={colors} />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textHero }]}>Key Ratios</Text>
            <View style={styles.row}>
              <View style={[styles.ratioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.ratioValue, { color: colors.textPrimary }]}>
                  {`${Math.max(0, Math.round(savingsRate))}%`}
                </Text>
                <Text style={[styles.ratioLabel, { color: colors.textSecondary }]}>Savings rate</Text>
              </View>
              <View style={[styles.ratioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.ratioValue, { color: colors.textPrimary }]}>
                  {`${Math.max(0, Math.round(dti))}%`}
                </Text>
                <Text style={[styles.ratioLabel, { color: colors.textSecondary }]}>Debt-to-income</Text>
              </View>
            </View>

            {spendingBreakdown.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textHero }]}>Spending Breakdown</Text>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {spendingBreakdown.map(([category, amount]) => (
                    <MetricBar
                      key={category}
                      label={category}
                      value={amount}
                      max={expenses || 1}
                      color="#F59E0B"
                      colors={colors}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {goals.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textHero }]}>Goals</Text>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {goals.map((goal) => {
                    const progress =
                      goal.targetAmount > 0
                        ? Math.min(1, (goal.currentSavedAmount ?? 0) / goal.targetAmount)
                        : 0
                    return (
                      <View key={goal.id} style={styles.goalRow}>
                        <Text style={[styles.goalName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {goal.name}
                        </Text>
                        <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                          {formatInr(goal.currentSavedAmount ?? 0)} / {formatInr(goal.targetAmount)}
                        </Text>
                        <View style={[styles.goalTrack, { backgroundColor: colors.border ?? 'rgba(0,0,0,0.06)' }]}>
                          <View
                            style={[
                              styles.goalFill,
                              { width: `${progress * 100}%`, backgroundColor: '#10B981' },
                            ]}
                          />
                        </View>
                      </View>
                    )
                  })}
                </View>
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors, screenWidth: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    back: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
    },
    spacer: {
      width: 44,
    },
    body: {
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    emptyState: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heading: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h2,
      fontWeight: Typography.fontWeights.bold,
      textAlign: 'center',
      marginBottom: 16,
    },
    copy: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      lineHeight: 24,
      textAlign: 'center',
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h3,
      fontWeight: Typography.fontWeights.bold,
      marginTop: 24,
      marginBottom: 12,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 8,
    },
    ratioCard: {
      flex: 1,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      alignItems: 'center',
    },
    ratioValue: {
      fontFamily: Typography.fontFamily,
      fontSize: 28,
      fontWeight: Typography.fontWeights.bold,
    },
    ratioLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      marginTop: 4,
    },
    goalRow: {
      marginBottom: 14,
    },
    goalName: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      marginBottom: 4,
    },
    goalAmount: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.regular,
      marginBottom: 6,
    },
    goalTrack: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    goalFill: {
      height: '100%',
      borderRadius: 4,
    },
  })
