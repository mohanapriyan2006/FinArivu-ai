import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RotateCcw, X } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import { getActionHistory, undoAction } from '@/services/ActionService'
import type { ActionHistoryItem } from '@/types/actions'
import { ActionStatusBadge } from './ActionStatusBadge'

interface Props {
  visible: boolean
  onClose: () => void
}

/**
 * Audit surface — the user's copilot action history. Read-only apart from
 * the Undo control on safely-reversible executed actions.
 */
export function ActionHistorySheet({ visible, onClose }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [items, setItems] = useState<ActionHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await getActionHistory())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (visible) load()
  }, [visible, load])

  const handleUndo = useCallback(
    async (item: ActionHistoryItem) => {
      setUndoingId(item.id)
      try {
        await undoAction(item.id)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'UNDONE', undoAvailable: false } : i,
          ),
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Undo failed.')
      } finally {
        setUndoingId(null)
      }
    },
    [],
  )

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Action history</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close action history"
          >
            <X size={22} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              No actions yet. Ask FinArivu to update a budget, add an expense,
              or create a goal.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.entityName ? (
                    <Text style={styles.itemEntity}>{item.entityName}</Text>
                  ) : null}
                  <Text style={styles.itemTime}>
                    {item.executedAt || item.createdAt
                      ? new Date(
                          (item.executedAt || item.createdAt) as string,
                        ).toLocaleString('en-IN')
                      : ''}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <ActionStatusBadge status={item.status} />
                  {item.undoAvailable && (
                    <Pressable
                      style={styles.undoButton}
                      onPress={() => handleUndo(item)}
                      disabled={undoingId === item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Undo ${item.title}`}
                    >
                      {undoingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <RotateCcw size={14} color={colors.primary} />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: {
      ...Typography.headlineMedium,
      color: colors.textHero,
      fontSize: 18,
      fontWeight: '700',
    },
    closeButton: { padding: 4 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyText: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      ...Typography.bodySmall,
      color: colors.danger,
      textAlign: 'center',
    },
    list: { paddingVertical: 8 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    itemMain: { flex: 1 },
    itemTitle: {
      ...Typography.bodySmall,
      color: colors.textHero,
      fontWeight: '600',
      fontSize: 13,
    },
    itemEntity: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    itemTime: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 3,
    },
    itemRight: { alignItems: 'flex-end', gap: 8 },
    undoButton: {
      padding: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
  })
