import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Receipt } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { formatInr, formatInrNumber } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Expense, ExpenseInput } from '@/services/ExpenseService'
import { useExpenses } from '@/hooks/useExpenses'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import type { StackNavigationProp } from '@react-navigation/stack'

import { TrackerScreen } from '../components/TrackerScreen'
import { FinancialRecordRow } from '../components/FinancialRecordRow'

function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

type NavigationProp = StackNavigationProp<RootStackParamList>

function Summary({ data }: { data: Expense[] }) {
  const { colors } = useTheme()
  const styles = makeSummaryStyles(colors)
  const { thisMonth, count } = useMemo(() => {
    const thisMonth = data.filter((e) => isThisMonth(e.expenseDate)).reduce((s, e) => s + e.amount, 0)
    return { thisMonth, count: data.length }
  }, [data])

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>This Month</Text>
        <Text style={styles.value}>₹{formatInrNumber(thisMonth)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Transactions</Text>
        <Text style={styles.value}>{count}</Text>
      </View>
    </View>
  )
}

export default function ExpenseTrackerScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()

  return (
    <TrackerScreen<Expense, ExpenseInput>
      title="Expenses"
      useData={useExpenses}
      renderSummary={(data) => <Summary data={data} />}
      renderItem={(item) => (
        <FinancialRecordRow
          icon={Receipt}
          iconColor={colors.danger}
          iconBackground={colors.dangerBackground}
          title={item.description || 'Expense'}
          subtitle={`${dateLabel(item.expenseDate)}`}
          trailing={`₹${formatInrNumber(item.amount)}`}
        />
      )}
      buildInput={() => ({} as ExpenseInput)}
      fields={[]}
      addLabel="+ Add Expense"
      emptyIcon={Receipt}
      emptyTitle="No expenses yet"
      emptyMessage="Start tracking your spending to understand where your money goes."
      itemKey={(item) => item.id}
      onAdd={() => navigation.navigate('QuickAddExpense')}
      testID="expense-tracker"
    />
  )
}

const makeSummaryStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    right: {
      alignItems: 'flex-end',
    },
    label: {
      fontSize: Typography.bodySmall.fontSize,
      lineHeight: Typography.bodySmall.lineHeight,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    value: {
      fontSize: Typography.h3.fontSize,
      lineHeight: Typography.h3.lineHeight,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  })
