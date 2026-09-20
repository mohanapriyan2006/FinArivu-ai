import React, { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { ArrowLeft } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { formatInr } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

import { GradientBar } from './components/GradientBar'
import { MiniGauge } from './components/MiniGauge'
import { DonutChart } from './components/DonutChart'
import type { DonutSegment } from './components/DonutChart'

export default function FinancialHealthPlaceholderScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { profile } = useFinancialProfile()
  const styles = useMemo(() => makeStyles(colors), [colors])

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

  const spendingSegments = useMemo<DonutSegment[]>(() => {
    if (!profile.expenses?.breakdown) return []
    const palette = [
      colors.primary,
      colors.secondary,
      colors.success,
      colors.warning,
      colors.danger,
    ]
    return (Object.entries(profile.expenses.breakdown) as [string, number][])
      .filter(([, amount]) => typeof amount === 'number' && amount > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount], index) => ({
        label: category,
        value: amount,
        color: palette[index % palette.length],
        displayValue: formatInr(amount, { fallback: '₹0' }),
      }))
  }, [profile.expenses?.breakdown, colors])

  const savingsRateTone =
    savingsRate >= 20 ? colors.success : savingsRate >= 10 ? colors.warning : colors.danger
  const dtiTone =
    dti <= 30 ? colors.success : dti <= 50 ? colors.warning : colors.danger

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
              <GradientBar
                label="Income"
                value={formatInr(income, { fallback: '₹0' })}
                progress={income / barMax}
                color={colors.success}
              />
              <GradientBar
                label="Expenses"
                value={formatInr(expenses, { fallback: '₹0' })}
                progress={expenses / barMax}
                color={colors.danger}
              />
              <GradientBar
                label="Savings"
                value={formatInr(savings, { fallback: '₹0' })}
                progress={savings / barMax}
                color={colors.secondary}
              />
              <GradientBar
                label="Investments"
                value={formatInr(investments, { fallback: '₹0' })}
                progress={investments / barMax}
                color={colors.primary}
              />
              <GradientBar
                label="Loans"
                value={formatInr(loans, { fallback: '₹0' })}
                progress={loans / barMax}
                color={colors.warning}
              />
              <GradientBar
                label="Net worth"
                value={formatInr(netWorth, { fallback: '₹0' })}
                progress={Math.abs(netWorth) / barMax}
                color={colors.primary}
                colorEnd={colors.secondary}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textHero }]}>Key Ratios</Text>
            <View style={[styles.card, styles.ratioRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MiniGauge
                percent={Math.max(0, savingsRate)}
                displayValue={`${Math.max(0, Math.round(savingsRate))}%`}
                label="Savings rate"
                color={savingsRateTone}
                colorEnd={colors.secondary}
                caption={savingsRate >= 20 ? 'Healthy' : savingsRate >= 10 ? 'Fair' : 'Low'}
              />
              <View style={[styles.ratioDivider, { backgroundColor: colors.border }]} />
              <MiniGauge
                percent={Math.max(0, Math.min(100, dti))}
                displayValue={`${Math.max(0, Math.round(dti))}%`}
                label="Debt-to-income"
                color={dtiTone}
                colorEnd={colors.warning}
                caption={dti <= 30 ? 'Healthy' : dti <= 50 ? 'Watch' : 'High'}
              />
            </View>

            {spendingSegments.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textHero }]}>Spending Breakdown</Text>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <DonutChart
                    segments={spendingSegments}
                    centerValue={formatInr(expenses, { fallback: '₹0' })}
                    centerLabel="Monthly spend"
                  />
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
                        <View style={styles.goalHeader}>
                          <Text style={[styles.goalName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {goal.name}
                          </Text>
                          <View style={[styles.goalPctChip, { backgroundColor: colors.accentBackground }]}>
                            <Text style={[styles.goalPct, { color: colors.accentDark }]}>
                              {`${Math.round(progress * 100)}%`}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                          {formatInr(goal.currentSavedAmount ?? 0)} / {formatInr(goal.targetAmount)}
                        </Text>
                        <GradientBar
                          label=""
                          value=""
                          progress={progress}
                          color={colors.warning}
                          colorEnd={colors.success}
                          height={8}
                        />
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

const makeStyles = (colors: ThemeColors) =>
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
      borderRadius: 24,
      borderWidth: 1,
      padding: 20,
      marginBottom: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    ratioRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratioDivider: {
      width: 1,
      alignSelf: 'stretch',
      marginHorizontal: 16,
    },
    goalRow: {
      marginBottom: 18,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    goalName: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
      flex: 1,
      marginRight: 8,
    },
    goalPctChip: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    goalPct: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.bold,
    },
    goalAmount: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.regular,
      marginBottom: 8,
    },
  })
