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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeft, History } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import { useScenarios } from '@/hooks/useScenarios'
import { previewAction, executeAction, cancelAction } from '@/services/ActionService'
import type { ActionOperation, ActionPreview, ActionResult } from '@/types/actions'
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

/**
 * Scenario Lab — deterministic what-if simulations on real user data.
 * Running a scenario never mutates records; applying a change routes
 * through the Phase 1 action preview + explicit user confirmation.
 */
export default function ScenarioLabScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute<LabRoute>()
  const styles = useMemo(() => makeStyles(colors), [colors])

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

  useEffect(() => {
    scenarios
      .loadTypes()
      .then(setTypes)
      .catch(() => setTypes([]))
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
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textHero }]}>
          Scenario Lab
        </Text>
        <Pressable
          onPress={() => {
            setHistoryOpen(true)
            refreshHistory()
          }}
          style={styles.back}
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
        <Text style={styles.caption}>
          Explore what-if changes on your real data — simulations never modify
          anything.
        </Text>

        <ScenarioTypeSelector
          types={types}
          selected={selected}
          onSelect={setSelected}
        />

        <ScenarioInputForm
          type={selectedType}
          submitting={running}
          onRun={(parameters) => {
            if (!selected) return
            setActionPreview(null)
            setActionResult(null)
            setLastRun({ scenarioType: selected, parameters })
            scenarios.run({ scenarioType: selected, parameters })
          }}
        />

        {running && (
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
          <>
            <ScenarioResultCard result={result} onApply={handleApply} />
            {result.status === 'COMPUTED' && !result.scenarioId && lastRun && (
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
                <Text style={styles.saveText}>Save scenario</Text>
              </Pressable>
            )}
          </>
        )}

        {actionPreview && !actionResult && (
          <ActionPreviewCard
            preview={actionPreview}
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
          />
        )}
        {actionResult && <ActionResultCard result={actionResult} />}
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
    back: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...Typography.titleSmall,
      fontSize: 18,
      fontWeight: '700',
    },
    caption: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 10,
    },
    loader: { marginTop: 16 },
    error: {
      ...Typography.bodyMedium,
      color: colors.danger,
      fontSize: 13,
      marginTop: 12,
    },
    saveButton: {
      alignSelf: 'flex-start',
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
  })
