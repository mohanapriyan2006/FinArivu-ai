import { useMemo } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { PieChart } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { formatInr, formatInrNumber } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Budget, BudgetInput } from '@/services/BudgetService'
import { useBudgets } from '@/hooks/useBudgets'

import { TrackerScreen } from '../components/TrackerScreen'
import { FinancialRecordRow } from '../components/FinancialRecordRow'

function Summary({ data }: { data: Budget[] }) {
  const { colors } = useTheme()
  const styles = makeSummaryStyles(colors)
  const { total, count } = useMemo(() => {
    const total = data.reduce((s, b) => s + b.monthlyLimit, 0)
    return { total, count: data.length }
  }, [data])

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Total Budget</Text>
        <Text style={styles.value}>₹{formatInrNumber(total)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Categories</Text>
        <Text style={styles.value}>{count}</Text>
      </View>
    </View>
  )
}

export default function BudgetTrackerScreen() {
  const { colors } = useTheme()

  return (
    <TrackerScreen<Budget, BudgetInput>
      title="Budget"
      useData={useBudgets}
      renderSummary={(data) => <Summary data={data} />}
      renderItem={(item) => (
        <FinancialRecordRow
          icon={PieChart}
          iconColor={colors.warning}
          iconBackground={colors.accentBackground}
          title={item.categoryName || 'Budget'}
          subtitle="Monthly limit"
          trailing={`₹${formatInrNumber(item.monthlyLimit)}`}
        />
      )}
      buildInput={() => ({} as BudgetInput)}
      fields={[]}
      addLabel="+ Add Budget"
      emptyIcon={PieChart}
      emptyTitle="No budget set"
      emptyMessage="Set category budgets to keep spending in check."
      itemKey={(item) => item.id}
      onAdd={() => Alert.alert('Add budget', 'Add budget form is coming soon.')}
      testID="budget-tracker"
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
