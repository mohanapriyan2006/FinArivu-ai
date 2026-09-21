import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { ChevronRight, Radar as RadarIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'
import type { RadarInsight, RadarSummary } from '@/types/moneyRadar'

interface Props {
  /** Raw `money_radar_card` artifact content (a serialised RadarSummary). */
  data: Record<string, unknown>
}

/** Compact copilot artifact — counts + top insight rows + open action. */
export function MoneyRadarCard({ data }: Props) {
  const { colors } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const summary = data as unknown as RadarSummary
  const insights = (summary.insights ?? []).slice(0, 3)
  const severityColor = (s: string) =>
    s === 'HIGH'
      ? colors.danger
      : s === 'MEDIUM'
        ? colors.warning
        : s === 'LOW'
          ? colors.secondary
          : colors.textTertiary

  return (
    <View style={styles.card} testID="money-radar-card">
      <View style={styles.header}>
        <RadarIcon size={14} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.title}>Money Radar</Text>
        {summary.attentionCount > 0 && (
          <View
            style={[styles.badge, { backgroundColor: colors.danger + '1A' }]}
          >
            <Text style={[styles.badgeText, { color: colors.danger }]}>
              {summary.attentionCount} to review
            </Text>
          </View>
        )}
      </View>

      {insights.length === 0 ? (
        <Text style={styles.empty}>
          Nothing needs attention — coverage is on the Radar tab.
        </Text>
      ) : (
        insights.map((i: RadarInsight) => (
          <View key={i.id} style={styles.row}>
            <View
              style={[
                styles.dot,
                { backgroundColor: severityColor(i.severity) },
              ]}
            />
            <Text style={styles.rowTitle} numberOfLines={1}>
              {i.title}
            </Text>
          </View>
        ))
      )}

      <Pressable
        style={styles.open}
        onPress={() =>
          navigation.navigate('Main', { screen: 'Insights' })
        }
        accessibilityRole="button"
        accessibilityLabel="Open Money Radar"
      >
        <Text style={styles.openText}>Open Money Radar</Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: 8,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: {
      ...Typography.labelSmall,
      color: colors.textHero,
      fontSize: 13,
      fontWeight: '700',
      flex: 1,
    },
    badge: {
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    badgeText: { fontSize: 10, fontWeight: '700' },
    empty: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    dot: { width: 7, height: 7, borderRadius: 4 },
    rowTitle: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 12,
      flex: 1,
    },
    open: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 10,
      minHeight: 44,
    },
    openText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
  })
