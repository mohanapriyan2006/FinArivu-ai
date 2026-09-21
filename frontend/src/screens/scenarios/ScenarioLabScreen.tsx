import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import {
  ArrowLeft,
  Bookmark,
  FlaskConical,
  History,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import { useScenarios } from '@/hooks/useScenarios'
import {
  cancelAction,
  executeAction,
  previewAction,
} from '@/services/ActionService'
import type {
  ActionOperation,
  ActionPreview,
  ActionResult,
} from '@/types/actions'
import type {
  ScenarioApplyAction,
  ScenarioHistoryItem,
  ScenarioTypeInfo,
} from '@/types/scenarios'
import type { RootStackParamList } from '@/types/navigation'
import { ScenarioTypeSelector } from '@/components/scenarios/ScenarioTypeSelector'
import { ScenarioInputForm } from '@/components/scenarios/ScenarioInputForm'
import { ScenarioResultCard } from '@/components/scenarios/ScenarioResultCard'
import { ScenarioHistorySheet } from '@/components/scenarios/ScenarioHistorySheet'
import { ActionPreviewCard } from '@/components/actions/ActionPreviewCard'
import { ActionResultCard } from '@/components/actions/ActionResultCard'

type LabRoute = RouteProp<RootStackParamList, 'ScenarioLab'>

/** One-tap preset scenarios — real runs against server-side data. */
const PRESETS = [
  {
    id: 'income-up',
    label: 'Salary +10%',
    scenarioType: 'INCOME_CHANGE',
    parameters: { change_type: 'percent', change_value: 10 },
  },
  {
    id: 'expense-down',
    label: 'Expenses −10%',
    scenarioType: 'EXPENSE_CHANGE',
    parameters: { change_type: 'percent', change_value: -10 },
  },
  {
    id: 'save-more',
    label: 'Save ₹5k/mo more',
    scenarioType: 'MONTHLY_SAVINGS_CHANGE',
    parameters: { change_amount: 5000 },
  },
  {
    id: 'purchase',
    label: '₹75k purchase',
    scenarioType: 'PURCHASE',
    parameters: { purchase_amount: 75000, item_name: 'Purchase' },
  },
  {
    id: 'retire-early',
    label: 'Retire at 50',
    scenarioType: 'RETIREMENT_AGE_CHANGE',
    parameters: { new_retirement_age: 50 },
  },
  {
    id: 'inflation',
    label: 'Inflation 8%',
    scenarioType: 'INFLATION_CHANGE',
    parameters: { new_inflation_rate: 0.08 },
  },
] as const

/**
 * Scenario Lab — deterministic what-if simulations on real user data.
 * Running a scenario never mutates records; applying a change routes
 * through the Phase 1 action preview + explicit user confirmation.
 */
export default function ScenarioLabScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute<LabRoute>()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const scenarios = useScenarios()
  const [types, setTypes] = useState<ScenarioTypeInfo[]>([])
  const [selected, setSelected] = useState<string | null>(
    route.params?.scenarioType ?? null,
  )
  const [history, setHistory] = useState<ScenarioHistoryItem[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [actionPreview, setActionPreview] = useState<ActionPreview | null>(null)
  const [actionResult, setActionResult] = useState<ActionResult | null>(null)
  const [lastRun, setLastRun] = useState<{
    scenarioType: string
    parameters: Record<string, unknown>
  } | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  useEffect(() => {
    scenarios
      .loadTypes()
      .then(setTypes)
      .catch(() => setTypes([]))
    // Money Radar preset bridge — auto-run when an insight hands a
    // scenario over (POST /v1/scenarios/run with the preset verbatim).
    const preset = route.params?.preset
    if (preset?.scenarioType) {
      setSelected(preset.scenarioType)
      setLastRun({
        scenarioType: preset.scenarioType,
        parameters: preset.parameters ?? {},
      })
      scenarios.run({
        scenarioType: preset.scenarioType,
        parameters: preset.parameters ?? {},
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      setHistory(await scenarios.loadHistory())
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedType = types.find((t) => t.type === selected) ?? null
  const running = scenarios.state.kind === 'running'
  const result =
    scenarios.state.kind === 'result' ||
    scenarios.state.kind === 'needs_input' ||
    scenarios.state.kind === 'insufficient_data' ||
    scenarios.state.kind === 'saved'
      ? scenarios.state.result
      : null

  const runScenario = useCallback(
    (scenarioType: string, parameters: Record<string, unknown>) => {
      setActionPreview(null)
      setActionResult(null)
      setLastRun({ scenarioType, parameters })
      scenarios.run({ scenarioType, parameters })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setActivePreset(preset.id)
    setSelected(preset.scenarioType)
    runScenario(preset.scenarioType, { ...preset.parameters })
  }

  const handleApply = useCallback(async (apply: ScenarioApplyAction) => {
    // Bridge into Phase 1 — server-validated preview + explicit confirm.
    setActionResult(null)
    const preview = await previewAction({
      operation: apply.operation as ActionOperation,
      arguments: apply.arguments,
    })
    setActionPreview(preview)
  }, [])

  const handleConfirmAction = useCallback(async () => {
    if (!actionPreview?.executionId) return
    const res = await executeAction(actionPreview.executionId)
    setActionResult(res)
  }, [actionPreview])

  const handleCancelAction = useCallback(async () => {
    if (actionPreview?.executionId) {
      await cancelAction(actionPreview.executionId).catch(() => undefined)
    }
    setActionPreview(null)
  }, [actionPreview])

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textHero }]}>
          Scenario Lab
        </Text>
        <Pressable
          onPress={() => {
            setHistoryOpen(true)
            refreshHistory()
          }}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Scenario history"
        >
          <History size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          style={styles.hero}
        >
          <View style={styles.heroIconRing}>
            <View style={styles.heroIcon}>
              <FlaskConical size={26} color={colors.onPrimary} strokeWidth={2.2} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Explore what-if scenarios</Text>
          <Text style={styles.heroSubtitle}>
            Run deterministic simulations on your real data — nothing changes
            until you explicitly confirm it.
          </Text>
        </Animated.View>

        {/* One-tap presets */}
        <Animated.View entering={FadeInDown.duration(400).delay(140)}>
          <Text style={styles.sectionLabel}>TRY A SCENARIO</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetRow}
          >
            {PRESETS.map((preset) => {
              const active = preset.id === activePreset && running
              return (
                <Pressable
                  key={preset.id}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => handlePreset(preset)}
                  accessibilityRole="button"
                  accessibilityLabel={preset.label}
                >
                  {active ? (
                    <ActivityIndicator size={12} color={colors.onPrimary} />
                  ) : null}
                  <Text
                    style={[
                      styles.presetText,
                      active && styles.presetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </Animated.View>

        {/* Custom scenario builder */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)}>
          <Text style={styles.sectionLabel}>BUILD YOUR OWN</Text>
          <ScenarioTypeSelector
            types={types}
            selected={selected}
            onSelect={(t) => {
              setSelected(t)
              setActivePreset(null)
            }}
          />
          <ScenarioInputForm
            type={selectedType}
            submitting={running}
            onRun={(parameters) => {
              if (!selected) return
              setActivePreset(null)
              runScenario(selected, parameters)
            }}
          />
        </Animated.View>

        {running && !result && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}

        {scenarios.state.kind === 'error' && (
          <Text style={styles.error}>{scenarios.state.message}</Text>
        )}

        {result && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text style={styles.sectionLabel}>RESULT</Text>
            <ScenarioResultCard result={result} onApply={handleApply} />
            {result.status === 'COMPUTED' &&
              !result.scenarioId &&
              lastRun && (
                <Pressable
                  style={styles.saveButton}
                  onPress={() =>
                    scenarios.save({
                      scenarioType: lastRun.scenarioType,
                      parameters: lastRun.parameters,
                      title: result.title,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Save scenario"
                >
                  <Bookmark size={13} color={colors.primary} />
                  <Text style={styles.saveText}>Save to history</Text>
                </Pressable>
              )}
          </Animated.View>
        )}

        {scenarios.state.kind === 'saved' && (
          <Text style={styles.savedNote}>Saved to your scenario history.</Text>
        )}

        {actionPreview && !actionResult && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={styles.sectionLabel}>CONFIRM CHANGE</Text>
            <ActionPreviewCard
              preview={actionPreview}
              onConfirm={handleConfirmAction}
              onCancel={handleCancelAction}
            />
          </Animated.View>
        )}
        {actionResult && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <ActionResultCard result={actionResult} />
          </Animated.View>
        )}
      </ScrollView>

      <ScenarioHistorySheet
        visible={historyOpen}
        items={history}
        loading={historyLoading}
        onClose={() => setHistoryOpen(false)}
        onOpen={async (item) => {
          setHistoryOpen(false)
          await scenarios.loadSaved(item.id)
        }}
        onRerun={async (item) => {
          setHistoryOpen(false)
          await scenarios.rerun(item.id)
        }}
        onDelete={async (item) => {
          await scenarios.remove(item.id)
          refreshHistory()
        }}
      />
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
    },
    title: {
      ...Typography.titleSmall,
      fontSize: 18,
      fontWeight: '700',
    },
    hero: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 12,
    },
    heroIconRing: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark
        ? 'rgba(91, 78, 250, 0.18)'
        : 'rgba(91, 78, 250, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(91, 78, 250, 0.4)'
        : 'rgba(91, 78, 250, 0.25)',
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    heroTitle: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 19,
      fontWeight: '800',
      marginTop: 14,
      textAlign: 'center',
    },
    heroSubtitle: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 320,
    },
    sectionLabel: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      marginTop: 18,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    presetRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 16,
      paddingVertical: 2,
    },
    presetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    presetChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetText: {
      ...Typography.labelSmall,
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    presetTextActive: {
      color: colors.onPrimary,
    },
    loader: { marginTop: 20 },
    error: {
      ...Typography.bodyMedium,
      color: colors.danger,
      fontSize: 13,
      marginTop: 14,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    saveText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontWeight: '700',
      fontSize: 12,
    },
    savedNote: {
      ...Typography.labelSmall,
      color: colors.success,
      fontSize: 11,
      marginTop: 8,
    },
  })
