import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Shield } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

import { TrackerHeader } from '../components/TrackerHeader'
import { useInsurance } from '@/hooks/useInsurance'
import { formatInrNumber } from '@/utils/formatInr'
import { FinancialRecordRow } from '../components/FinancialRecordRow'

export default function InsuranceTrackerScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const { data } = useInsurance()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TrackerHeader title="Insurance" />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Insurance tracker</Text>
        <Text style={styles.infoText}>
          A dedicated insurance CRUD backend endpoint is not yet available. Insurance policies can be added during the financial profile setup.
        </Text>
      </View>

      {data.map((policy, index) => (
        <FinancialRecordRow
          key={`${policy.type}-${index}`}
          icon={Shield}
          iconColor={colors.success}
          iconBackground={colors.successBackground}
          title={policy.type}
          subtitle={policy.annualPremium ? `Premium ₹${formatInrNumber(policy.annualPremium)}` : 'No premium recorded'}
          trailing={policy.coverage ? `₹${formatInrNumber(policy.coverage)}` : undefined}
        />
      ))}
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    infoBox: {
      marginHorizontal: 20,
      marginVertical: 16,
      padding: 20,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTitle: {
      fontSize: Typography.h3.fontSize,
      lineHeight: Typography.h3.lineHeight,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    infoText: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      color: colors.textSecondary,
    },
  })
