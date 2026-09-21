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
import { Check, Clock, Eye, FlaskConical, X } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import {
  SNOOZE_OPTIONS,
  categoryLabel,
  priorityLabel,
  snoozeOptionLabel,
} from '@/hooks/actionPlanUiState'
import {
  formatEvidenceValue,
  freshnessLabel,
} from '@/hooks/moneyRadarUiState'
import { navigateToAction } from '@/navigation/actionRoutes'
import {
  cancelAction,
  executeAction,
  previewAction,
} from '@/services/ActionService'
import { ActionPreviewCard } from '@/components/actions/ActionPreviewCard'
import { ActionResultCard } from '@/components/actions/ActionResultCard'
import { priorityColor } from './PlanItemCard'
import type { RootStackParamList } from '@/types/navigation'
import type { ActionOperation, ActionPreview, ActionResult } from '@/types/actions'
import type {
  FinancialPlanItem,
  SnoozeOption,
} from '@/types/actionPlan'

interface Props {
  item: FinancialPlanItem | null
  onClose: () => void
  onAccept: (id: string) => void
  onSnooze: (id: string, option: SnoozeOption) => void
  onDismiss: (id: string) => void
  onComplete: (id: string, executionId?: string) => void
  /** Refresh plan + radar after an execution. */
  onChanged: () => void
}

/**
 * Evidence-first plan-item detail — WHY → EVIDENCE → IMPACT → NEXT STEP.
 * Mutations route through Phase 1 preview/confirm; scenarios hand off to
 * Phase 2. This sheet never mutates financial records itself.
 */
export function PlanDetailSheet({
  item,
  onClose,
  onAccept,
  onSnooze,
  onDismiss,
  onComplete,
  onChanged,
}: Props) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const [preview, setPreview] = useState<ActionPreview | null>(null)
  const [result, setResult] = useState<ActionResult | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)

  if (!item) return null
  const accent = priorityColor(item.priority, colors)
  const open = item.status === 'PENDING' || item.status === 'IN_PROGRESS'
  const actions = new Set(item.actions)
  const freshness = freshnessLabel(item.freshness)

  const runScenario = () => {
    if (!item.scenarioPreset) return
    onClose()
    navigation.navigate('ScenarioLab', {
      scenarioType: item.scenarioPreset.scenarioType,
      preset: {
        scenarioType: item.scenarioPreset.scenarioType,
        parameters: item.scenarioPreset.parameters,
        title: item.scenarioPreset.title,
      },
    })
  }

  const startPreview = async () => {
    if (!item.actionPreset) return
    setActionBusy(true)
    try {
      setPreview(
        await previewAction({
          operation: item.actionPreset.operation as ActionOperation,
          arguments: item.actionPreset.arguments,
        }),
      )
    } catch {
      setPreview(null)
    } finally {
      setActionBusy(false)
    }
  }

  const doNow = () => {
    if (!item.route) return
    navigateToAction(navigation, {
      type: 'NAVIGATE',
      route: item.route,
      payload: {},
      enabled: true,
    })
    onClose()
  }

  return (
    <Modal
      visible={!!item}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={[styles.chip, { backgroundColor: accent + '1A' }]}>
              <Text style={[styles.chipText, { color: accent }]}>
                {priorityLabel(item.priority)}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
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
            <Text style={styles.summary}>{item.summary}</Text>

            {item.impact.description ? (
              <View style={styles.impactCard}>
                <Text style={styles.impactLabel}>
                  {item.impact.metricLabel || 'Expected impact'}
                </Text>
                <Text style={[styles.impactValue, { color: accent }]}>
                  {item.impact.description}
                </Text>
              </View>
            ) : null}

            {item.why.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>WHY IS THIS IN YOUR PLAN?</Text>
                {item.why.map((line, i) => (
                  <Text key={i} style={styles.whyLine}>
                    {line}
                  </Text>
                ))}
              </>
            )}

            {item.evidence.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>EVIDENCE</Text>
                <View style={styles.evidenceCard}>
                  {item.evidence.map((ev) => (
                    <View key={ev.key} style={styles.evidenceRow}>
                      <View style={styles.evidenceLabelWrap}>
                        <Text style={styles.evidenceLabel}>{ev.label}</Text>
                        {ev.source ? (
                          <Text style={styles.evidenceSource}>{ev.source}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.evidenceValue}>
                        {formatEvidenceValue(ev)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {open && (
              <>
                <Text style={styles.sectionLabel}>WHAT CAN YOU DO?</Text>
                <View style={styles.actionsRow}>
                  {actions.has('SIMULATE') && item.scenarioPreset && (
                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={runScenario}
                      accessibilityRole="button"
                      accessibilityLabel="Simulate"
                      testID="plan-simulate"
                    >
                      <FlaskConical size={12} color={colors.onPrimary} />
                      <Text style={[styles.actionText, styles.actionTextPrimary]}>
                        Simulate
                      </Text>
                    </Pressable>
                  )}
                  {actions.has('PREVIEW_ACTION') && item.actionPreset && (
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => void startPreview()}
                      disabled={actionBusy}
                      accessibilityRole="button"
                      accessibilityLabel="Preview change"
                      testID="plan-preview-action"
                    >
                      {actionBusy ? (
                        <ActivityIndicator size={12} color={colors.primary} />
                      ) : (
                        <Eye size={12} color={colors.textPrimary} />
                      )}
                      <Text style={styles.actionText}>Preview change</Text>
                    </Pressable>
                  )}
                  {actions.has('DO_NOW') && item.route && (
                    <Pressable
                      style={styles.actionBtn}
                      onPress={doNow}
                      accessibilityRole="button"
                      accessibilityLabel="Review"
                      testID="plan-review"
                    >
                      <Text style={styles.actionText}>Review</Text>
                    </Pressable>
                  )}
                  {actions.has('COMPLETE') && (
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => {
                        onComplete(item.id)
                        onClose()
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Mark complete"
                      testID="plan-complete"
                    >
                      <Check size={12} color={colors.success} />
                      <Text style={[styles.actionText, { color: colors.success }]}>
                        Done
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.secondaryRow}>
                  {item.status === 'PENDING' && (
                    <Pressable
                      onPress={() => onAccept(item.id)}
                      style={styles.secondaryBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Accept into plan"
                    >
                      <Text style={styles.secondaryText}>Accept</Text>
                    </Pressable>
                  )}
                  {actions.has('SNOOZE') && (
                    <Pressable
                      onPress={() => setSnoozeOpen((v) => !v)}
                      style={styles.secondaryBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Snooze"
                      testID="plan-snooze"
                    >
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={styles.secondaryText}>Snooze</Text>
                    </Pressable>
                  )}
                  {actions.has('DISMISS') && (
                    <Pressable
                      onPress={() => {
                        onDismiss(item.id)
                        onClose()
                      }}
                      style={styles.secondaryBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss"
                      testID="plan-dismiss"
                    >
                      <Text style={styles.secondaryText}>Dismiss</Text>
                    </Pressable>
                  )}
                </View>

                {snoozeOpen && (
                  <View style={styles.snoozeCard} testID="plan-snooze-options">
                    {SNOOZE_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        style={styles.snoozeOption}
                        onPress={() => {
                          onSnooze(item.id, option)
                          setSnoozeOpen(false)
                          onClose()
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Snooze ${snoozeOptionLabel(option)}`}
                      >
                        <Text style={styles.snoozeText}>
                          {snoozeOptionLabel(option)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
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
                    if (res.status === 'EXECUTED') {
                      onComplete(item.id, p.executionId)
                    }
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

            <Text style={styles.provenance}>
              {categoryLabel(item.category)} · Source:{' '}
              {item.sourceType === 'RADAR'
                ? `Money Radar (${item.sourceInsightType ?? 'insight'})`
                : item.sourceType}
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
    chip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
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
    whyLine: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 4,
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
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    secondaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 44,
      paddingHorizontal: 12,
    },
    secondaryText: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    snoozeCard: {
      marginTop: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.primaryBackground : colors.background,
      overflow: 'hidden',
    },
    snoozeOption: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      minHeight: 44,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      justifyContent: 'center',
    },
    snoozeText: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 13,
    },
    previewWrap: { marginTop: 14 },
    provenance: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 4,
    },
  })
