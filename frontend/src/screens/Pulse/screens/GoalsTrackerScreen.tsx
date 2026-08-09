import { useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View } from 'react-native'
import { Target } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { formatInrNumber } from '@/utils/formatInr'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { Goal, GoalInput } from '@/services/GoalService'
import { useGoals } from '@/hooks/useGoals'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import type { StackNavigationProp } from '@react-navigation/stack'

import { TrackerScreen } from '../components/TrackerScreen'
import { FinancialRecordRow } from '../components/FinancialRecordRow'

type NavigationProp = StackNavigationProp<RootStackParamList>

function dateLabel(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `Target: ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
}

function Summary({ data }: { data: Goal[] }) {
  const { colors } = useTheme()
  const styles = makeSummaryStyles(colors)
  const { totalTarget, count } = useMemo(() => {
    const totalTarget = data.reduce((s, g) => s + g.targetAmount, 0)
    return { totalTarget, count: data.length }
  }, [data])

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Total Target</Text>
        <Text style={styles.value}>₹{formatInrNumber(totalTarget)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Goals</Text>
        <Text style={styles.value}>{count}</Text>
      </View>
    </View>
  )
}

export default function GoalsTrackerScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()

  return (
    <TrackerScreen<Goal, GoalInput>
      title="Goals"
      useData={useGoals}
      renderSummary={(data) => <Summary data={data} />}
      renderItem={(item) => (
        <FinancialRecordRow
          icon={Target}
          iconColor={colors.warning}
          iconBackground={colors.accentBackground}
          title={item.goalName}
          subtitle={dateLabel(item.targetDate)}
          trailing={`₹${formatInrNumber(item.currentAmount)}`}
        />
      )}
      buildInput={() => ({} as GoalInput)}
      fields={[]}
      addLabel="+ Create Goal"
      emptyIcon={Target}
      emptyTitle="No financial goals yet"
      emptyMessage="Create a goal and track your progress over time."
      itemKey={(item) => item.id}
      onAdd={() => navigation.navigate('CreateGoal')}
      testID="goals-tracker"
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
