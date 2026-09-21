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
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Radar as RadarIcon,
  RefreshCcw,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { useActionPlan } from '@/hooks/useActionPlan'
import { groupPlanItems } from '@/hooks/actionPlanUiState'
import type { RootStackParamList } from '@/types/navigation'
import type { FinancialPlanItem } from '@/types/actionPlan'
import { PlanItemCard } from './components/PlanItemCard'
import { PlanDetailSheet } from './components/PlanDetailSheet'

type Nav = StackNavigationProp<RootStackParamList>

/**
 * My Financial Plan — the few priorities worth attention this week.
 *
 * Items are deterministic organisations of Money Radar signals; every
 * card carries evidence + provenance, and mutations route exclusively
 * through Scenario Lab / Action Copilot bridges.
 */
export default function FinancialActionPlanScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const {
    state,
    plan,
    items,
    isBusy,
    refresh,
    regenerate,
    accept,
    snooze,
    dismiss,
    complete,
  } = useActionPlan()
  const [selected, setSelected] = useState<FinancialPlanItem | null>(null)

  const styles = useMemo(() => makeStyles(colors), [colors])
  const grouped = useMemo(() => groupPlanItems(items), [items])

  const periodLabel = useMemo(() => {
    if (!plan) return ''
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    return `${fmt(plan.periodStart)} – ${fmt(plan.periodEnd)}`
  }, [plan])

  const onItemChanged = () => {
    // After a Phase 1 execution, reconcile the plan against fresh state.
    void regenerate()
  }

  const Section = ({
    label,
    rows,
  }: {
    label: string
    rows: FinancialPlanItem[]
  }) =>
    rows.length ? (
      <View>
        <Text style={styles.sectionLabel}>{label}</Text>
        {rows.map((item) => (
          <PlanItemCard key={item.id} item={item} onPress={setSelected} />
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
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerLeft}>
          <ClipboardList size={20} color={colors.primary} strokeWidth={2.2} />
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            My Financial Plan
          </Text>
        </View>
        <Pressable
          onPress={regenerate}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh plan"
          disabled={isBusy}
          testID="plan-refresh"
        >
          {state.kind === 'generating' ? (
            <ActivityIndicator size={16} color={colors.primary} />
          ) : (
            <RefreshCcw size={18} color={colors.textPrimary} />
          )}
        </Pressable>
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
        testID="action-plan-screen"
      >
        {state.kind === 'loading' || state.kind === 'generating' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {state.kind === 'generating'
                ? 'Reconciling your plan…'
                : 'Loading your plan…'}
            </Text>
          </View>
        ) : state.kind === 'error' ? (
          <View style={styles.center} testID="plan-error">
            <Text style={styles.errorText}>{state.message}</Text>
            <Pressable
              onPress={refresh}
              style={styles.retryBtn}
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : plan ? (
          <>
            <Text style={styles.subtitle}>
              Your priorities for this week · {periodLabel}
            </Text>

            {plan.summary ? (
              <Text style={styles.planSummary}>{plan.summary}</Text>
            ) : null}

            {grouped.active.length === 0 ? (
              <View style={styles.clearCard} testID="plan-clear">
                <CheckCircle2 size={32} color={colors.success} />
                <Text style={styles.clearTitle}>You're on track</Text>
                <Text style={styles.clearText}>
                  No urgent financial actions right now. Check Radar for new
                  signals.
                </Text>
                <Pressable
                  style={styles.radarLink}
                  onPress={() =>
                    navigation.navigate('Main', { screen: 'Insights' })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Review Radar"
                >
                  <RadarIcon size={13} color={colors.primary} />
                  <Text style={[styles.radarLinkText, { color: colors.primary }]}>
                    Review Radar
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Section label="THIS WEEK" rows={grouped.active} />
                <Section label="SNOOZED" rows={grouped.snoozed} />
                <Section label="COMPLETED" rows={grouped.completed} />
              </>
            )}

            <Text style={styles.footer}>
              Deterministic — priorities come from your Money Radar signals.
              Actions preview before they apply.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <PlanDetailSheet
        item={selected}
        onClose={() => setSelected(null)}
        onAccept={(id) => void accept(id)}
        onSnooze={(id, option) => void snooze(id, option)}
        onDismiss={(id) => void dismiss(id)}
        onComplete={(id, executionId) => void complete(id, executionId)}
        onChanged={onItemChanged}
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
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
    },
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
      marginBottom: 6,
    },
    planSummary: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12,
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
    radarLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 16,
      minHeight: 44,
      paddingHorizontal: 12,
    },
    radarLinkText: {
      ...Typography.labelSmall,
      fontSize: 13,
      fontWeight: '700',
    },
    footer: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 16,
    },
  })
