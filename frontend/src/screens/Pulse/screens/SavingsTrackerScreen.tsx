import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Wallet } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { formatInrNumber } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Asset, AssetInput } from '@/services/AssetService'
import { useSavings } from '@/hooks/useSavings'

import { TrackerScreen } from '../components/TrackerScreen'
import { FinancialRecordRow } from '../components/FinancialRecordRow'

function Summary({ data }: { data: Asset[] }) {
  const { colors } = useTheme()
  const styles = makeSummaryStyles(colors)
  const { total, count } = useMemo(() => {
    const total = data.reduce((s, a) => s + a.value, 0)
    return { total, count: data.length }
  }, [data])

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Total Savings</Text>
        <Text style={styles.value}>₹{formatInrNumber(total)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Accounts</Text>
        <Text style={styles.value}>{count}</Text>
      </View>
    </View>
  )
}

export default function SavingsTrackerScreen() {
  const { colors } = useTheme()

  return (
    <TrackerScreen<Asset, AssetInput>
      title="Savings"
      useData={useSavings}
      renderSummary={(data) => <Summary data={data} />}
      renderItem={(item) => (
        <FinancialRecordRow
          icon={Wallet}
          iconColor={colors.success}
          iconBackground={colors.successBackground}
          title={item.name}
          subtitle={item.assetType}
          trailing={`₹${formatInrNumber(item.value)}`}
        />
      )}
      fields={[
        { key: 'name', label: 'Account name', placeholder: 'Emergency Fund' },
        { key: 'value', label: 'Current value', placeholder: '50000', keyboard: 'numeric' },
        { key: 'assetType', label: 'Type', placeholder: 'Bank', autoCapitalize: 'words' },
      ]}
      buildInput={(values) => ({
        name: values.name,
        value: Number(values.value || '0'),
        assetType: values.assetType || 'Bank',
        isEmergencyFund: false,
      })}
      addLabel="+ Add Savings"
      emptyIcon={Wallet}
      emptyTitle="No savings added"
      emptyMessage="Add your savings accounts and emergency funds to track them."
      itemKey={(item) => item.id}
      testID="savings-tracker"
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
