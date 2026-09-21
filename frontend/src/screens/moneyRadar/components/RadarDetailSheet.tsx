import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { ClipboardList, FlaskConical, X } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import {
  formatEvidenceValue,
  freshnessLabel,
  severityLabel,
} from '@/hooks/moneyRadarUiState'
import { navigateToAction } from '@/navigation/actionRoutes'
import {
  cancelAction,
  executeAction,
  previewAction,
} from '@/services/ActionService'
import { addInsightToPlan } from '@/services/ActionPlanService'
import { ActionPreviewCard } from '@/components/actions/ActionPreviewCard'
import { ActionResultCard } from '@/components/actions/ActionResultCard'
import { severityColor } from './RadarInsightCard'
import type { RootStackParamList } from '@/types/navigation'
import type { ActionOperation, ActionPreview, ActionResult } from '@/types/actions'
import type {
  InsightAction,
  RadarInsight,
} from '@/types/moneyRadar'

interface Props {
  insight: RadarInsight | null
  onClose: () => void
  onDismiss: (id: string) => void
  /** Called after a mutation completes so the radar can rescan. */
  onChanged: () => void
}

/**
 * Evidence-first detail sheet — every number shown is sourced from the
 * detector payload; actions hand off to Scenario Lab / Action Copilot.
 */
export function RadarDetailSheet({
  insight,
  onClose,
  onDismiss,
  onChanged,
}: Props) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const [preview, setPreview] = useState<ActionPreview | null>(null)
  const [result, setResult] = useState<ActionResult | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [inPlan, setInPlan] = useState(false)
  const [planBusy, setPlanBusy] = useState(false)

  if (!insight) return null
  const accent = severityColor(insight.severity, colors)
  const freshness = freshnessLabel(insight.freshness)

  const runScenario = (action: InsightAction) => {
    if (!action.scenario) return
    onClose()
    navigation.navigate('ScenarioLab', {
      scenarioType: action.scenario.scenarioType,
      preset: {
        scenarioType: action.scenario.scenarioType,
        parameters: action.scenario.parameters,
        title: action.scenario.title,
      },
    })
  }

  const startPreview = async (action: InsightAction) => {
    if (!action.action) return
    setActionBusy(true)
    try {
      setPreview(
        await previewAction({
          operation: action.action.operation as ActionOperation,
          arguments: action.action.arguments,
        }),
      )
    } catch {
      setPreview(null)
    } finally {
      setActionBusy(false)
    }
  }

  const addToPlan = async () => {
    if (inPlan || planBusy) return
    setPlanBusy(true)
    try {
      await addInsightToPlan(insight.id)
      setInPlan(true)
    } catch {
      // Non-actionable insights (VIEW-only info) simply can't be added.
      setInPlan(false)
    } finally {
      setPlanBusy(false)
    }
  }

  const handleAction = (action: InsightAction) => {
    switch (action.kind) {
      case 'VIEW':
        if (action.route) {
          navigateToAction(navigation, {
            type: 'NAVIGATE',
            route: action.route,
            payload: {},
            enabled: true,
          })
          onClose()
        }
        return
      case 'RUN_SCENARIO':
        runScenario(action)
        return
      case 'PREVIEW_ACTION':
        void startPreview(action)
        return
      default:
        return // EXPLAIN — the sheet already shows the explanation
    }
  }

  return (
    <Modal
      visible={!!insight}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={[styles.chip, { backgroundColor: accent + '1A' }]}>
              <Text style={[styles.chipText, { color: accent }]}>
                {severityLabel(insight.severity)}
              </Text>
            </View>
            <Text style={styles.title}>{insight.title}</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close detail"
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.summary}>{insight.summary}</Text>

            {insight.impact.description ? (
              <View style={styles.impactCard}>
                <Text style={styles.impactLabel}>
                  {insight.impact.metricLabel || 'Impact'}
                </Text>
                <Text style={[styles.impactValue, { color: accent }]}>
                  {insight.impact.description}
                </Text>
              </View>
            ) : null}

            {insight.evidence.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>EVIDENCE</Text>
                <View style={styles.evidenceCard}>
                  {insight.evidence.map((item) => (
                    <View key={item.key} style={styles.evidenceRow}>
                      <View style={styles.evidenceLabelWrap}>
                        <Text style={styles.evidenceLabel}>{item.label}</Text>
                        {item.source ? (
                          <Text style={styles.evidenceSource}>
                            {item.source}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.evidenceValue}>
                        {formatEvidenceValue(item)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {insight.explanation.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>WHY THIS MATTERS</Text>
                {insight.explanation.map((line, i) => (
                  <Text key={i} style={styles.explanation}>
                    {line}
                  </Text>
                ))}
              </>
            )}

            {insight.actions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>NEXT STEPS</Text>
                <View style={styles.actionsRow}>
                  {insight.actions
                    .filter((a) => a.kind !== 'EXPLAIN')
                    .map((action, i) => (
                      <Pressable
                        key={`${action.kind}-${i}`}
                        style={[
                          styles.actionBtn,
                          action.kind === 'RUN_SCENARIO' &&
                            styles.actionBtnPrimary,
                        ]}
                        onPress={() => handleAction(action)}
                        disabled={actionBusy}
                        accessibilityRole="button"
                        accessibilityLabel={action.label}
                        testID={`radar-action-${action.kind.toLowerCase()}`}
                      >
                        {action.kind === 'RUN_SCENARIO' && (
                          <FlaskConical
                            size={12}
                            color={colors.onPrimary}
                          />
                        )}
                        {actionBusy && action.kind === 'PREVIEW_ACTION' ? (
                          <ActivityIndicator
                            size={12}
                            color={colors.primary}
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.actionText,
                            action.kind === 'RUN_SCENARIO' &&
                              styles.actionTextPrimary,
                          ]}
                        >
                          {action.label}
                        </Text>
                      </Pressable>
                    ))}
                </View>
              </>
            )}

            {preview && !result && (
              <View style={styles.previewWrap}>
                <ActionPreviewCard
                  preview={preview}
                  onConfirm={async (p) => {
                    if (!p.executionId) return
                    const res = await executeAction(p.executionId)
                    setResult(res)
                    onChanged()
                  }}
                  onCancel={async (p) => {
                    if (p.executionId) {
                      await cancelAction(p.executionId).catch(() => undefined)
                    }
                    setPreview(null)
                  }}
                />
              </View>
            )}
            {result && (
              <View style={styles.previewWrap}>
                <ActionResultCard result={result} />
              </View>
            )}

            {(insight.status === 'ACTIVE' || insight.status === 'SEEN') && (
              <Pressable
                style={styles.planBtn}
                onPress={() => void addToPlan()}
                disabled={planBusy || inPlan}
                accessibilityRole="button"
                accessibilityLabel={inPlan ? 'In your plan' : 'Add to my plan'}
                testID="radar-add-to-plan"
              >
                {planBusy ? (
                  <ActivityIndicator size={14} color={colors.primary} />
                ) : (
                  <ClipboardList size={14} color={colors.primary} />
                )}
                <Text style={styles.planBtnText}>
                  {inPlan ? 'In Plan' : 'Add to Plan'}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.dismissBtn}
              onPress={() => {
                onDismiss(insight.id)
                onClose()
              }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss insight"
              testID="radar-dismiss"
            >
              <Text style={styles.dismissText}>Dismiss this insight</Text>
            </Pressable>

            <Text style={styles.provenance}>
              {insight.detectorVersion}
              {insight.source?.engines?.length
                ? ` · ${insight.source.engines.join(', ')}`
                : ''}
              {freshness ? ` · ${freshness}` : ''}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const makeStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
      maxHeight: '88%',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 10,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    chip: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    chipText: {
      ...Typography.labelSmall,
      fontSize: 10,
      fontWeight: '700',
    },
    title: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 17,
      fontWeight: '700',
      flex: 1,
    },
    closeBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summary: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 8,
    },
    impactCard: {
      backgroundColor: isDark ? colors.primaryBackground : colors.background,
      borderRadius: 16,
      padding: 14,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    impactLabel: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    impactValue: {
      ...Typography.titleSmall,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 4,
    },
    sectionLabel: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      marginTop: 18,
      marginBottom: 8,
    },
    evidenceCard: {
      backgroundColor: isDark ? colors.primaryBackground : colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
    },
    evidenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    evidenceLabelWrap: { flex: 1 },
    evidenceLabel: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 13,
    },
    evidenceSource: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 1,
    },
    evidenceValue: {
      ...Typography.bodyMedium,
      color: colors.textHero,
      fontSize: 13,
      fontWeight: '700',
    },
    explanation: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 6,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 44,
    },
    actionBtnPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionText: {
      ...Typography.labelSmall,
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    actionTextPrimary: { color: colors.onPrimary },
    previewWrap: { marginTop: 14 },
    planBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 16,
      alignSelf: 'center',
      minHeight: 44,
      paddingHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    planBtnText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    dismissBtn: {
      marginTop: 18,
      alignSelf: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    dismissText: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: '600',
    },
    provenance: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
  })
