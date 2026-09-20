import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { CircleCheck, Hourglass } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type {
  ActionExecutionStatus,
  ActionPreview,
} from '@/types/actions'
import { ActionDiffRow } from './ActionDiffRow'
import { ActionStatusBadge } from './ActionStatusBadge'
import { impactLines } from './actionFormat'

interface Props {
  preview: ActionPreview
  /** Terminal status after user resolved the preview. */
  resolvedStatus?: ActionExecutionStatus
  onConfirm?: (preview: ActionPreview) => void
  onCancel?: (preview: ActionPreview) => void
}

/**
 * Server-issued action preview with explicit Confirm / Cancel controls.
 * Confirmation calls `onConfirm` which routes through
 * POST /v1/copilot/actions/execute — the card itself never mutates data.
 */
export function ActionPreviewCard({
  preview,
  resolvedStatus,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [busy, setBusy] = useState<'confirm' | 'cancel' | null>(null)

  const resolved = resolvedStatus !== undefined
  const after = preview.after ?? {}
  const before = preview.before ?? {}
  const fields = Object.keys(after)
  const impacts = impactLines(preview.impact)

  const handleConfirm = async () => {
    setBusy('confirm')
    try {
      await onConfirm?.(preview)
    } finally {
      setBusy(null)
    }
  }

  const handleCancel = async () => {
    setBusy('cancel')
    try {
      await onCancel?.(preview)
    } finally {
      setBusy(null)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <CircleCheck size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{preview.title}</Text>
          {preview.entityName ? (
            <Text style={styles.entity}>{preview.entityName}</Text>
          ) : null}
        </View>
        {resolved ? (
          <ActionStatusBadge status={resolvedStatus as string} />
        ) : (
          <ActionStatusBadge status="AWAITING_CONFIRMATION" />
        )}
      </View>

      <View style={styles.divider} />

      {/* before → after diff */}
      {fields.map((field) => (
        <ActionDiffRow
          key={field}
          field={field}
          before={before[field]}
          after={after[field]}
        />
      ))}

      {/* deterministic impact */}
      {impacts.length > 0 && (
        <View style={styles.impactBlock}>
          {impacts.map((line, i) => (
            <Text key={`imp-${i}`} style={styles.impactText}>
              {line}
            </Text>
          ))}
        </View>
      )}

      {preview.affectedAreas?.length ? (
        <Text style={styles.affected}>
          Affects: {preview.affectedAreas.join(', ')}
        </Text>
      ) : null}

      {!resolved && preview.requiresConfirmation && (
        <>
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={busy !== null}
              accessibilityRole="button"
              accessibilityLabel="Confirm change"
            >
              {busy === 'confirm' ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.confirmText}>Confirm</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={busy !== null}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              {busy === 'cancel' ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={styles.cancelText}>Cancel</Text>
              )}
            </Pressable>
          </View>
          <View style={styles.expiryRow}>
            <Hourglass size={11} color={colors.textTertiary} />
            <Text style={styles.expiryText}>
              Preview expires shortly — nothing changes until you confirm.
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    title: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 14,
      fontWeight: '700',
    },
    entity: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    impactBlock: {
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 2,
    },
    impactText: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
    },
    affected: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 6,
      textTransform: 'capitalize',
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    button: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmText: {
      ...Typography.labelSmall,
      color: colors.onPrimary,
      fontWeight: '700',
      fontSize: 13,
    },
    cancelText: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontWeight: '600',
      fontSize: 13,
    },
    expiryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
    },
    expiryText: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
    },
  })
