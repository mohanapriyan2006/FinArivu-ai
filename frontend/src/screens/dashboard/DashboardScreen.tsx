import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native'
import { useAuthContext } from '@/contexts/AuthContext'
import { PieChart } from 'react-native-chart-kit'

import { useTheme } from '@/contexts/ThemeContext'
import { DashboardService, type DashboardSummary } from '@/services/DashboardService'

const screenWidth = Dimensions.get('window').width

export default function DashboardScreen() {
  const { colors } = useTheme()
  const { getToken } = useAuthContext()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const styles = makeStyles(colors)

  const loadSummary = useCallback(async () => {
    try {
      const token = await getToken()
      const data = await DashboardService.getSummary(token)
      setSummary(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const chartColors = ['#0D47A1', '#DC2626', '#F4B400', '#22C55E', '#14B8A6', '#8B5CF6']

  const pieData =
    summary?.expenseBreakdown.map((item, index) => ({
      name: item.category,
      amount: item.amount,
      color: chartColors[index % chartColors.length],
      legendFontColor: colors.textPrimary,
      legendFontSize: 12,
    })) || []

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: () => colors.primary,
    labelColor: () => colors.textPrimary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryValue}>
            ₹{(summary?.totalIncome || 0).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.danger }]}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryValue}>
            ₹{(summary?.totalExpenses || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={[styles.netCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.netLabel}>Net Cash Flow</Text>
        <Text style={styles.netValue}>
          ₹{(summary?.netCashFlow || 0).toLocaleString()}
        </Text>
      </View>

      {pieData.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>Expenses by Category</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={180}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.cardTitle}>Recent Income</Text>
        {(summary?.recentIncome.length || 0) === 0 && (
          <Text style={styles.emptyText}>No income entries yet</Text>
        )}
        {summary?.recentIncome.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>{item.source}</Text>
              <Text style={styles.rowDate}>{item.incomeDate}</Text>
            </View>
            <Text style={[styles.rowAmount, { color: colors.success }]}>
              +₹{item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.cardTitle}>Recent Expenses</Text>
        {(summary?.recentExpenses.length || 0) === 0 && (
          <Text style={styles.emptyText}>No expense entries yet</Text>
        )}
        {summary?.recentExpenses.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>{item.description || 'Expense'}</Text>
              <Text style={styles.rowDate}>{item.expenseDate}</Text>
            </View>
            <Text style={[styles.rowAmount, { color: colors.danger }]}>
              -₹{item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
    },
    summaryLabel: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: 4,
    },
    netCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    netLabel: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    netValue: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: 4,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLeft: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    rowDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rowAmount: {
      fontSize: 14,
      fontWeight: '600',
    },
  })
}
