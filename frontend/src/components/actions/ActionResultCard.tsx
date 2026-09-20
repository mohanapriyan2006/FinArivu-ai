import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { RotateCcw } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ActionResult } from '@/types/actions'
import { ActionDiffRow } from './ActionDiffRow'
import { ActionStatusBadge } from './ActionStatusBadge'
import { fieldLabel, formatFieldValue } from './actionFormat'

interface Props {
  result: ActionResult
  onUndo?: (result: ActionResult) => void
}

/**
 * Post-execution result card — what changed, deterministic impact, and a
 * safe Undo control when the operation supports it.
 */
export function ActionResultCard({ result, onUndo }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [busy, setBusy] = useState(false)

  const before = result.result?.before ?? {}
  const after = result.result?.after ?? {}
  const fields = Object.keys(after)

  const impactAfter =
    result.impact && typeof result.impact.after === 'object'
      ? (result.impact.after as Record<string, unknown>)
      : null

  const handleUndo = async () => {
    setBusy(true)
    try {
      await onUndo?.(result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{result.title}</Text>
          {result.entityName ? (
            <Text style={styles.entity}>{result.entityName}</Text>
          ) : null}
        </View>
        <ActionStatusBadge status={result.status} />
      </View>

      {result.message ? (
        <Text style={styles.message}>{result.message}</Text>
      ) : null}

      {fields.length > 0 && <View style={styles.divider} />}
      {fields.map((field) => (
        <ActionDiffRow
          key={field}
          field={field}
          before={before[field]}
          after={after[field]}
        />
      ))}

      {impactAfter && (
        <View style={styles.impactBlock}>
          {Object.entries(impactAfter).map(([key, value]) => (
            <Text key={key} style={styles.impactText}>
              {fieldLabel(key)}: {formatFieldValue(key, value)}
            </Text>
          ))}
        </View>
      )}

      {result.status === 'EXECUTED' && result.undoAvailable && onUndo && (
        <Pressable
          style={styles.undoButton}
          onPress={handleUndo}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Undo this change"
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <RotateCcw size={13} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.undoText}>Undo</Text>
            </>
          )}
        </Pressable>
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
    message: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 8,
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
    undoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    undoText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
  })
