import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Bell, FlaskConical, Radar as RadarIcon, RefreshCcw, ShieldCheck } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { useMoneyRadar } from '@/hooks/useMoneyRadar'
import { groupInsights } from '@/hooks/moneyRadarUiState'
import type { RootStackParamList } from '@/types/navigation'
import type { RadarInsight } from '@/types/moneyRadar'
import { RadarInsightCard } from './components/RadarInsightCard'
import { RadarDetailSheet } from './components/RadarDetailSheet'
import { RadarSummaryStrip } from './components/RadarSummaryStrip'
import { RadarCoverageSection } from './components/RadarCoverageSection'

type Nav = StackNavigationProp<RootStackParamList>

/**
 * Money Radar — deterministic, evidence-backed proactive intelligence.
 * Insights are produced server-side by detectors; this screen renders,
 * explains, and bridges to Scenario Lab / Action Copilot.
 */
export default function MoneyRadarScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const { state, summary, insights, isBusy, refresh, rescan, markSeen, dismiss } =
    useMoneyRadar()
  const [selected, setSelected] = useState<RadarInsight | null>(null)

  const styles = useMemo(() => makeStyles(colors), [colors])
  const grouped = useMemo(() => groupInsights(insights), [insights])

  const openInsight = (insight: RadarInsight) => {
    setSelected(insight)
    if (insight.status === 'ACTIVE') {
      void markSeen(insight.id)
    }
  }

  const Section = ({
    label,
    items,
  }: {
    label: string
    items: RadarInsight[]
  }) =>
    items.length ? (
      <View>
        <Text style={styles.sectionLabel}>{label}</Text>
        {items.map((i) => (
          <RadarInsightCard key={i.id} insight={i} onPress={openInsight} />
        ))}
      </View>
    ) : null

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RadarIcon size={20} color={colors.primary} strokeWidth={2.2} />
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            Money Radar
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={rescan}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Rescan finances"
            disabled={isBusy}
            testID="radar-rescan"
          >
            {state.kind === 'scanning' ? (
              <ActivityIndicator size={16} color={colors.primary} />
            ) : (
              <RefreshCcw size={18} color={colors.textPrimary} />
            )}
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ScenarioLab')}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Open Scenario Lab"
          >
            <FlaskConical size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isBusy && state.kind === 'ready'}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        testID="money-radar-screen"
      >
        {state.kind === 'loading' || state.kind === 'scanning' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {state.kind === 'scanning'
                ? 'Scanning your finances…'
                : 'Loading Money Radar…'}
            </Text>
          </View>
        ) : state.kind === 'error' ? (
          <View style={styles.center} testID="radar-error">
            <Text style={styles.errorText}>{state.message}</Text>
            <Pressable
              onPress={refresh}
              style={styles.retryBtn}
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : summary ? (
          <>
            <Text style={styles.subtitle}>
              What changed, what needs attention, what to do next.
            </Text>

            <RadarSummaryStrip summary={summary} />

            {insights.length === 0 ? (
              <View style={styles.clearCard} testID="radar-clear">
                <ShieldCheck size={32} color={colors.success} />
                <Text style={styles.clearTitle}>All clear</Text>
                <Text style={styles.clearText}>
                  Nothing needs attention right now. Radar keeps watching —
                  anything new will surface here with evidence.
                </Text>
              </View>
            ) : (
              <>
                <Section
                  label="NEEDS ATTENTION"
                  items={grouped.needsAttention}
                />
                <Section
                  label="OPPORTUNITIES"
                  items={grouped.opportunities}
                />
                <Section
                  label="INFORMATIONAL"
                  items={grouped.informational}
                />
              </>
            )}

            <Text style={styles.sectionLabel}>RADAR COVERAGE</Text>
            <RadarCoverageSection coverage={summary.coverage} />

            <Text style={styles.footer}>
              Last scan{' '}
              {summary.generatedAt
                ? new Date(summary.generatedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
              {' · '}Deterministic — every insight is backed by your data.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <RadarDetailSheet
        insight={selected}
        onClose={() => setSelected(null)}
        onDismiss={(id) => void dismiss(id)}
        onChanged={() => void rescan()}
      />
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { paddingHorizontal: 20, paddingTop: 4 },
    subtitle: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 14,
    },
    sectionLabel: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      marginTop: 16,
      marginBottom: 8,
    },
    center: { alignItems: 'center', paddingVertical: 80, gap: 12 },
    loadingText: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
    },
    errorText: {
      ...Typography.bodyMedium,
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    retryBtn: { minHeight: 44, justifyContent: 'center', padding: 8 },
    retryText: { fontSize: 14, fontWeight: '700' },
    clearCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 28,
      marginTop: 8,
    },
    clearTitle: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 10,
    },
    clearText: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 6,
    },
    footer: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 16,
    },
  })
