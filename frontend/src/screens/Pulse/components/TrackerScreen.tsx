import { useCallback, useRef, type ReactNode } from 'react'
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { LucideIcon } from 'lucide-react-native'

import { ScalePress } from '@/components/animation/ScalePress'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { UseTrackerListReturn } from '@/hooks/useTrackerList'

import { TrackerEmptyState } from './TrackerEmptyState'
import { TrackerErrorState } from './TrackerErrorState'
import { TrackerHeader } from './TrackerHeader'
import { TrackerSkeleton } from './TrackerSkeleton'

export interface TrackerScreenProps<T, TInput = never> {
  title: string
  useData: () => UseTrackerListReturn<T, TInput>
  renderItem: (item: T) => ReactNode
  renderSummary?: (data: T[]) => ReactNode
  addLabel: string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyMessage: string
  itemKey: (item: T) => string
  onAdd: () => void
  testID?: string
}

export function TrackerScreen<T, TInput = never>({
  title,
  useData,
  renderItem,
  renderSummary,
  addLabel,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  itemKey,
  onAdd,
  testID,
}: TrackerScreenProps<T, TInput>) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const { data, isLoading, error, refresh } = useData()

  // Refetch on focus so records added via the create screen show up.
  const skipFirstFocus = useRef(true)
  useFocusEffect(
    useCallback(() => {
      if (skipFirstFocus.current) {
        skipFirstFocus.current = false
        return
      }
      refresh()
    }, [refresh])
  )

  if (isLoading && !error && data.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TrackerHeader title={title} />
        <TrackerSkeleton />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TrackerHeader title={title} onAdd={data.length > 0 ? onAdd : undefined} addLabel={addLabel} />

      {error ? (
        <TrackerErrorState message={error} onRetry={refresh} testID={`${testID}-error`} />
      ) : data.length === 0 ? (
        <TrackerEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          message={emptyMessage}
          actionLabel={addLabel}
          onAction={onAdd}
          testID={`${testID}-empty`}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={itemKey}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {renderSummary ? renderSummary(data) : null}
            </View>
          }
          renderItem={({ item }) => <View style={styles.item}>{renderItem(item)}</View>}
          testID={`${testID}-list`}
        />
      )}

      {data.length > 0 ? (
        <View style={styles.fab} pointerEvents="box-none">
          <ScalePress onPress={onAdd} scale={0.96} testID={`${testID}-fab`}>
            <View style={[styles.fabButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.fabText, { color: colors.surface }]}>{addLabel}</Text>
            </View>
          </ScalePress>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      paddingBottom: 120,
      paddingTop: 8,
    },
    listHeader: {
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    item: {
      marginBottom: 10,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    fabButton: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 24,
      minHeight: 44,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    fabText: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      fontWeight: '700',
    },
  })
