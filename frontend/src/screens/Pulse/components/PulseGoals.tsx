import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, Target } from 'lucide-react-native'

import { ProgressBar } from '@/components/insights/Common'
import { ScalePress } from '@/components/animation/ScalePress'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { formatInr } from '@/utils/formatInr'
import type { PulseGoalMini } from '@/screens/Pulse/types'

interface PulseGoalsProps {
  goals: PulseGoalMini[]
  onViewAll: () => void
  testID?: string
}

export function PulseGoals({ goals, onViewAll, testID }: PulseGoalsProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Goals</Text>
        <ScalePress onPress={onViewAll} testID={`${testID}-view-all`}>
          <View style={styles.viewAll}>
            <Text style={styles.viewAllText}>View Goals</Text>
            <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
          </View>
        </ScalePress>
      </View>

      {goals.map((goal) => (
        <View key={goal.id} style={styles.card}>
          <View style={styles.top}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryBackground }]}>
              <Target size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {goal.name}
              </Text>
              <Text style={styles.target}>
                {formatInr(goal.current)} / {formatInr(goal.target)}
              </Text>
            </View>
            <Text style={styles.year}>Target {goal.targetYear}</Text>
          </View>

          <View style={styles.progress}>
            <ProgressBar
              progress={goal.progress}
              fillColor={colors.primary}
              trackColor={colors.border}
              height={6}
              delay={0}
            />
          </View>
        </View>
      ))}
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 8,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    viewAll: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    text: {
      flex: 1,
    },
    name: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    target: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
    year: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
    },
    progress: {
      marginTop: 4,
    },
  })
