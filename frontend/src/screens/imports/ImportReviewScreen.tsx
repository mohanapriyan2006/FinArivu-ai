import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RouteProp } from '@react-navigation/native'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  FileText,
  Pencil,
  X,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'
import type { ImportCandidate } from '@/types/imports'
import { useImportReview } from '@/hooks/useImport'
import {
  candidateStatusTone,
  confidenceTone,
  groupImportCandidates,
} from '@/hooks/importUiState'

type ReviewRoute = RouteProp<RootStackParamList, 'ImportReview'>

const TONE_COLOR: Record<string, keyof ThemeColors> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'textSecondary',
}

function valueText(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default function ImportReviewScreen() {
  const { colors, isDark } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<ReviewRoute>()
  const batchId = route.params?.batchId ?? ''
  const { state, preview, notice, decide, confirm, cancel } =
    useImportReview(batchId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const styles = useMemo(() => makeStyles(colors), [colors])

  const reviewable = preview?.batch.status === 'REVIEW_REQUIRED'

  const grouped = useMemo(
    () => groupImportCandidates(preview?.candidates ?? []),
    [preview],
  )

  const startEdit = (c: ImportCandidate) => {
    setEditingId(c.id)
    setEditText(valueText(c.editedValue ?? c.proposedValue))
  }

  const saveEdit = async (c: ImportCandidate) => {
    const raw = editText.trim()
    const numeric = Number(raw.replace(/,/g, ''))
    const value = Number.isFinite(numeric) && raw !== '' ? numeric : raw
    await decide(c.id, 'EDITED', value)
    setEditingId(null)
  }

  const renderCandidate = (c: ImportCandidate) => {
    const accepted = c.decision !== 'SKIPPED' && c.operation !== 'SKIP'
    const editable =
      reviewable && c.kind !== 'RECORD' && c.operation !== 'SKIP'
    const tint = TONE_COLOR[candidateStatusTone(c.validationState)]
    const confTint = TONE_COLOR[confidenceTone(c.confidence)]
    return (
      <View
        key={c.id}
        style={[styles.candidate, { borderColor: colors.border }]}
        testID={`candidate-${c.id}`}
      >
        <View style={styles.candidateHeader}>
          <Text
            style={[styles.candidateLabel, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {c.label}
          </Text>
          <View
            style={[
              styles.confidenceChip,
              { backgroundColor: colors[confTint] + '1A' },
            ]}
          >
            <Text
              style={[
                styles.confidenceText,
                { color: colors[confTint] },
              ]}
            >
              {c.confidence.toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.valueRow}>
          {c.currentValue !== null && c.currentValue !== undefined ? (
            <>
              <Text style={[styles.valueOld, { color: colors.textSecondary }]}>
                {valueText(c.currentValue)}
              </Text>
              <Text style={[styles.valueArrow, { color: colors.textSecondary }]}>
                →
              </Text>
            </>
          ) : null}
          {editingId === c.id ? (
            <TextInput
              style={[
                styles.editInput,
                { color: colors.textPrimary, borderColor: colors.primary },
              ]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              keyboardType="default"
              testID={`edit-input-${c.id}`}
            />
          ) : (
            <Text
              style={[
                styles.valueNew,
                {
                  color: accepted ? colors.textHero : colors.textSecondary,
                  textDecorationLine: accepted ? 'none' : 'line-through',
                },
              ]}
            >
              {valueText(c.editedValue ?? c.proposedValue)}
            </Text>
          )}
        </View>

        {c.validationState !== 'VALID' ? (
          <View style={styles.flagRow}>
            <CircleAlert size={12} color={colors[tint]} />
            <Text style={[styles.flagText, { color: colors[tint] }]}>
              {c.validationState.replace(/_/g, ' ').toLowerCase()}
            </Text>
          </View>
        ) : null}

        {(c.warnings ?? []).map((w, i) => (
          <Text
            key={`w-${i}`}
            style={[styles.warningText, { color: colors.warning }]}
          >
            {w}
          </Text>
        ))}

        {c.provenance?.sourceLabel ? (
          <Text style={[styles.provenance, { color: colors.textTertiary }]}>
            from “{c.provenance.sourceLabel}”
            {c.provenance.sourcePage ? ` · p.${c.provenance.sourcePage}` : ''}
            {c.provenance.sourceRow ? ` · row ${c.provenance.sourceRow}` : ''}
          </Text>
        ) : null}

        {reviewable ? (
          <View style={styles.candidateActions}>
            {editingId === c.id ? (
              <>
                <Pressable
                  style={[styles.miniButton, { backgroundColor: colors.primary }]}
                  onPress={() => saveEdit(c)}
                  accessibilityRole="button"
                  testID={`save-edit-${c.id}`}
                >
                  <Check size={14} color={colors.onPrimary} />
                  <Text style={[styles.miniButtonText, { color: colors.onPrimary }]}>
                    Save
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.miniButton,
                    { borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setEditingId(null)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[styles.miniButtonText, { color: colors.textSecondary }]}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={[
                    styles.miniButton,
                    accepted
                      ? { backgroundColor: colors.primarySoft }
                      : { backgroundColor: colors.primary },
                  ]}
                  onPress={() =>
                    decide(c.id, accepted ? 'SKIPPED' : 'ACCEPTED')
                  }
                  accessibilityRole="button"
                  testID={`toggle-${c.id}`}
                >
                  {accepted ? (
                    <X size={14} color={colors.primary} />
                  ) : (
                    <Check size={14} color={colors.onPrimary} />
                  )}
                  <Text
                    style={[
                      styles.miniButtonText,
                      { color: accepted ? colors.primary : colors.onPrimary },
                    ]}
                  >
                    {accepted ? 'Skip' : 'Accept'}
                  </Text>
                </Pressable>
                {editable ? (
                  <Pressable
                    style={[
                      styles.miniButton,
                      { borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => startEdit(c)}
                    accessibilityRole="button"
                    testID={`edit-${c.id}`}
                  >
                    <Pencil size={12} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.miniButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Edit
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </View>
    )
  }

  const body = () => {
    if (state.kind === 'loading' || state.kind === 'applying') {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>
            {state.kind === 'applying'
              ? 'Applying your import…'
              : 'Preparing review…'}
          </Text>
        </View>
      )
    }
    if (state.kind === 'error') {
      return (
        <View style={styles.center} testID="import-review-error">
          <CircleAlert size={32} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {state.message}
          </Text>
        </View>
      )
    }
    if (state.kind === 'cancelled') {
      return (
        <View style={styles.center} testID="import-review-cancelled">
          <FileText size={32} color={colors.textSecondary} />
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>
            This import was cancelled — nothing was applied.
          </Text>
        </View>
      )
    }
    if (state.kind === 'applied') {
      const r = state.result
      const applied = Object.entries(r.appliedCounts ?? {})
      return (
        <ScrollView contentContainerStyle={styles.scroll} testID="import-result">
          <View
            style={[
              styles.resultCard,
              { borderColor: colors.success, backgroundColor: colors.successBackground },
            ]}
          >
            <CheckCircle2 size={28} color={colors.success} />
            <Text style={[styles.resultTitle, { color: colors.textHero }]}>
              {r.status === 'PARTIALLY_APPLIED'
                ? 'Import partially applied'
                : 'Import applied'}
            </Text>
            {applied.length > 0 ? (
              applied.map(([domain, count]) => (
                <Text
                  key={domain}
                  style={[styles.resultLine, { color: colors.textPrimary }]}
                >
                  {count} {domain.replace(/_/g, ' ')} updated
                </Text>
              ))
            ) : (
              <Text style={[styles.resultLine, { color: colors.textSecondary }]}>
                No changes were applied.
              </Text>
            )}
            {(r.changedDomains ?? []).length > 0 ? (
              <Text style={[styles.resultMeta, { color: colors.textSecondary }]}>
                Recalculated: {r.changedDomains.join(', ')}
              </Text>
            ) : null}
            <Text style={[styles.resultMeta, { color: colors.textSecondary }]}>
              {r.radarRefreshed ? 'Money Radar refreshed' : 'Radar refresh pending'}
              {' · '}
              {r.planReconciled ? 'Plan reconciled' : 'Plan reconcile pending'}
            </Text>
          </View>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Done
            </Text>
          </Pressable>
        </ScrollView>
      )
    }
    if (!preview) return null

    const acceptedCount = grouped.changes.length
    return (
      <ScrollView contentContainerStyle={styles.scroll} testID="import-review">
        {/* Document header */}
        <View style={[styles.docCard, { borderColor: colors.border }]}>
          <FileText size={22} color={colors.primary} strokeWidth={2} />
          <View style={styles.docBody}>
            <Text
              style={[styles.docName, { color: colors.textHero }]}
              numberOfLines={1}
            >
              {preview.batch.fileName || 'Document'}
            </Text>
            <Text style={[styles.docMeta, { color: colors.textSecondary }]}>
              {preview.batch.documentType.replace(/_/g, ' ').toLowerCase()}
              {preview.batch.periodStart && preview.batch.periodEnd
                ? ` · ${preview.batch.periodStart} → ${preview.batch.periodEnd}`
                : ''}
            </Text>
          </View>
        </View>

        {notice ? (
          <View
            style={[styles.notice, { borderColor: colors.warning }]}
            testID="import-review-notice"
          >
            <CircleAlert size={14} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              {notice}
            </Text>
          </View>
        ) : null}

        {/* Detected fields */}
        {(preview.detectedFields ?? []).length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.textSecondary }]}>
              DETECTED
            </Text>
            <View style={[styles.detectedCard, { borderColor: colors.border }]}>
              {preview.detectedFields.map((f, i) => (
                <View key={`df-${i}`} style={styles.detectedRow}>
                  <Text
                    style={[styles.detectedLabel, { color: colors.textSecondary }]}
                  >
                    {f.label}
                  </Text>
                  <Text
                    style={[styles.detectedValue, { color: colors.textPrimary }]}
                  >
                    {valueText(f.value)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {grouped.changes.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.textSecondary }]}>
              CHANGES ({grouped.changes.length})
            </Text>
            {grouped.changes.map(renderCandidate)}
          </>
        ) : null}

        {grouped.review.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.textSecondary }]}>
              NEEDS YOUR DECISION ({grouped.review.length})
            </Text>
            {grouped.review.map(renderCandidate)}
          </>
        ) : null}

        {grouped.skipped.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.textSecondary }]}>
              SKIPPED ({grouped.skipped.length})
            </Text>
            {grouped.skipped.map(renderCandidate)}
          </>
        ) : null}

        {(preview.batch.summary?.warnings ?? []).map((w, i) => (
          <View
            key={`bw-${i}`}
            style={[styles.notice, { borderColor: colors.warning }]}
          >
            <Copy size={14} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.warning }]}>{w}</Text>
          </View>
        ))}

        {reviewable ? (
          <>
            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    acceptedCount > 0 ? colors.primary : colors.border,
                },
              ]}
              onPress={confirm}
              disabled={acceptedCount === 0}
              accessibilityRole="button"
              accessibilityLabel="Confirm and apply import"
              testID="import-confirm"
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color:
                      acceptedCount > 0 ? colors.onPrimary : colors.textSecondary,
                  },
                ]}
              >
                Confirm import ({acceptedCount})
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                Alert.alert(
                  'Cancel import?',
                  'The document and its candidates will be discarded.',
                  [
                    { text: 'Keep reviewing', style: 'cancel' },
                    { text: 'Cancel import', style: 'destructive', onPress: cancel },
                  ],
                )
              }
              accessibilityRole="button"
              testID="import-cancel"
            >
              <Text style={[styles.cancelText, { color: colors.danger }]}>
                Cancel import
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    )
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textHero }]}>
          Review import
        </Text>
        <View style={styles.backButton} />
      </View>
      {body()}
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
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
    },
    scroll: { paddingHorizontal: 24, paddingBottom: 48 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    centerText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      textAlign: 'center',
    },
    errorText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      textAlign: 'center',
    },
    docCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 12,
      backgroundColor: colors.surface,
      marginTop: 8,
    },
    docBody: { flex: 1 },
    docName: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
    docMeta: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
      backgroundColor: colors.accentBackground,
    },
    noticeText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      flex: 1,
    },
    section: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.semibold,
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 8,
    },
    detectedCard: {
      borderWidth: 1,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    detectedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    detectedLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
    },
    detectedValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.semibold,
    },
    candidate: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.surface,
      marginBottom: 10,
      gap: 6,
    },
    candidateHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    candidateLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
      flex: 1,
    },
    confidenceChip: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    confidenceText: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: Typography.fontWeights.semibold,
      textTransform: 'capitalize',
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    valueOld: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      textDecorationLine: 'line-through',
    },
    valueArrow: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
    },
    valueNew: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
    },
    editInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      minWidth: 140,
    },
    flagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    flagText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.semibold,
      textTransform: 'capitalize',
    },
    warningText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
    },
    provenance: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontStyle: 'italic',
    },
    candidateActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    miniButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      minHeight: 32,
    },
    miniButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.semibold,
    },
    primaryButton: {
      borderRadius: 14,
      alignItems: 'center',
      paddingVertical: 14,
      marginTop: 20,
    },
    primaryButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.bold,
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    cancelText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
    resultCard: {
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 16,
      padding: 24,
      gap: 8,
      marginTop: 16,
    },
    resultTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
    },
    resultLine: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
    },
    resultMeta: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      textAlign: 'center',
    },
  })
