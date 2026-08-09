import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CreditCard } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { formatInrNumber } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Liability, LiabilityInput } from '@/services/LiabilityService'
import { useCreditCards } from '@/hooks/useCreditCards'

import { TrackerScreen } from '../components/TrackerScreen'
import { FinancialRecordRow } from '../components/FinancialRecordRow'

function Summary({ data }: { data: Liability[] }) {
  const { colors } = useTheme()
  const styles = makeSummaryStyles(colors)
  const { outstanding, limit, count } = useMemo(() => {
    const outstanding = data.reduce((s, l) => s + l.amount, 0)
    const limit = data.reduce((s, l) => s + (l.creditLimit ?? 0), 0)
    return { outstanding, limit, count: data.length }
  }, [data])

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Outstanding</Text>
        <Text style={styles.value}>₹{formatInrNumber(outstanding)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Total Limit</Text>
        <Text style={styles.value}>₹{formatInrNumber(limit)}</Text>
      </View>
    </View>
  )
}

export default function CreditCardTrackerScreen() {
  const { colors } = useTheme()

  return (
    <TrackerScreen<Liability, LiabilityInput>
      title="Credit Cards"
      useData={useCreditCards}
      renderSummary={(data) => <Summary data={data} />}
      renderItem={(item) => (
        <FinancialRecordRow
          icon={CreditCard}
          iconColor={colors.secondary}
          iconBackground={colors.primaryBackground}
          title={item.name}
          subtitle={`Limit ₹${formatInrNumber(item.creditLimit ?? 0)}`}
          trailing={`₹${formatInrNumber(item.amount)}`}
        />
      )}
      fields={[
        { key: 'name', label: 'Card name / bank', placeholder: 'HDFC Regalia' },
        { key: 'amount', label: 'Outstanding amount', placeholder: '15000', keyboard: 'numeric' },
        { key: 'creditLimit', label: 'Credit limit', placeholder: '200000', keyboard: 'numeric' },
      ]}
      buildInput={(values) => ({
        name: values.name,
        amount: Number(values.amount || '0'),
        creditLimit: values.creditLimit ? Number(values.creditLimit) : undefined,
        liabilityType: 'Credit Card',
      })}
      addLabel="+ Add Credit Card"
      emptyIcon={CreditCard}
      emptyTitle="No credit cards added"
      emptyMessage="Track your credit cards and due amounts without storing sensitive details."
      itemKey={(item) => item.id}
      testID="credit-card-tracker"
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
