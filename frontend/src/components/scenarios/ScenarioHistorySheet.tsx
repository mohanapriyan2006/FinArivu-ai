import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { FlaskConical, RotateCcw, Trash2, X } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import { scenarioStatusLabel } from '@/hooks/scenarioUiState'
import type { ScenarioHistoryItem } from '@/types/scenarios'

interface Props {
  visible: boolean
  items: ScenarioHistoryItem[]
  loading?: boolean
  onClose: () => void
  onOpen: (item: ScenarioHistoryItem) => void
  onRerun: (item: ScenarioHistoryItem) => void
  onDelete: (item: ScenarioHistoryItem) => void
}

/** Saved-scenario history — open, re-run on current data, or delete. */
export function ScenarioHistorySheet({
  visible,
  items,
  loading,
  onClose,
  onOpen,
  onRerun,
  onDelete,
}: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Saved scenarios</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close history"
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loader}
            />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>
              No saved scenarios yet — run a simulation and save it.
            </Text>
          ) : (
            <ScrollView style={styles.list}>
              {items.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Pressable
                    style={styles.itemMain}
                    onPress={() => onOpen(item)}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                  >
                    <FlaskConical
                      size={15}
                      color={colors.primary}
                      strokeWidth={2.2}
                    />
                    <View style={styles.itemText}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title || item.scenarioType}
                      </Text>
                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {scenarioStatusLabel(item.status)}
                        {item.createdAt
                          ? ` · ${item.createdAt.slice(0, 10)}`
                          : ''}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => onRerun(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Re-run scenario"
                    style={styles.iconButton}
                  >
                    <RotateCcw size={15} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete scenario"
                    style={styles.iconButton}
                  >
                    <Trash2 size={15} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 16,
      maxHeight: '70%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontSize: 15,
      fontWeight: '700',
    },
    loader: { marginVertical: 20 },
    empty: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginVertical: 20,
    },
    list: { flexGrow: 0 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 10,
    },
    itemMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    itemText: { flex: 1 },
    itemTitle: {
      ...Typography.labelMedium,
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    itemMeta: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 1,
    },
    iconButton: { padding: 8 },
  })
