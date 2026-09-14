import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Banknote } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { formatInrNumber } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Liability } from '@/services/LiabilityService'
import { useLoans } from '@/hooks/useLoans'
import type { RootStackParamList } from '@/navigation/AppNavigator'

import { TrackerScreen } from '../components/TrackerScreen'
import { FinancialRecordRow } from '../components/FinancialRecordRow'

function Summary({ data }: { data: Liability[] }) {
  const { colors } = useTheme()
  const styles = makeSummaryStyles(colors)
  const { outstanding, emi, count } = useMemo(() => {
    const outstanding = data.reduce((s, l) => s + l.amount, 0)
    const emi = data.reduce((s, l) => s + (l.emi ?? 0), 0)
    return { outstanding, emi, count: data.length }
  }, [data])

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Outstanding</Text>
        <Text style={styles.value}>₹{formatInrNumber(outstanding)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Monthly EMI</Text>
        <Text style={styles.value}>₹{formatInrNumber(emi)}</Text>
      </View>
    </View>
  )
}

export default function LoanTrackerScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  return (
    <TrackerScreen<Liability>
      title="Loans & EMIs"
      useData={useLoans}
      renderSummary={(data) => <Summary data={data} />}
      renderItem={(item) => (
        <FinancialRecordRow
          icon={Banknote}
          iconColor={colors.danger}
          iconBackground={colors.dangerBackground}
          title={item.name}
          subtitle={`EMI ₹${formatInrNumber(item.emi ?? 0)} · ${item.liabilityType}`}
          trailing={`₹${formatInrNumber(item.amount)}`}
        />
      )}
      addLabel="+ Add Loan"
      onAdd={() => navigation.navigate('PulseSectionCreate', { section: 'loans' })}
      emptyIcon={Banknote}
      emptyTitle="No loans added"
      emptyMessage="Track your outstanding loans and EMIs in one place."
      itemKey={(item) => item.id}
      testID="loan-tracker"
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
