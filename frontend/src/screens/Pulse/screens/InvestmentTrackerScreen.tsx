import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { TrendingUp } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { formatInrNumber } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Asset } from '@/services/AssetService'
import { useInvestments } from '@/hooks/useInvestments'
import type { RootStackParamList } from '@/navigation/AppNavigator'

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
        <Text style={styles.label}>Current Value</Text>
        <Text style={styles.value}>₹{formatInrNumber(total)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Investments</Text>
        <Text style={styles.value}>{count}</Text>
      </View>
    </View>
  )
}

export default function InvestmentTrackerScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  return (
    <TrackerScreen<Asset>
      title="Investments"
      useData={useInvestments}
      renderSummary={(data) => <Summary data={data} />}
      renderItem={(item) => (
        <FinancialRecordRow
          icon={TrendingUp}
          iconColor={colors.primary}
          iconBackground={colors.primaryBackground}
          title={item.name}
          subtitle={item.assetType}
          trailing={`₹${formatInrNumber(item.value)}`}
        />
      )}
      addLabel="+ Add Investment"
      onAdd={() => navigation.navigate('PulseSectionCreate', { section: 'investments' })}
      emptyIcon={TrendingUp}
      emptyTitle="No investments added"
      emptyMessage="Add your existing investments to keep your financial picture complete."
      itemKey={(item) => item.id}
      testID="investment-tracker"
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
