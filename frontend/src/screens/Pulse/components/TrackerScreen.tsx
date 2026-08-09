import { useCallback, useState, type ReactNode } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { LucideIcon } from 'lucide-react-native'

import { ScalePress } from '@/components/animation/ScalePress'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { UseTrackerListReturn } from '@/hooks/useTrackerList'

import { AddRecordSheet, type FormField } from './AddRecordSheet'
import { FinancialRecordRow } from './FinancialRecordRow'
import { TrackerEmptyState } from './TrackerEmptyState'
import { TrackerErrorState } from './TrackerErrorState'
import { TrackerHeader } from './TrackerHeader'
import { TrackerSkeleton } from './TrackerSkeleton'

export interface TrackerScreenProps<T, TInput> {
  title: string
  useData: () => UseTrackerListReturn<T, TInput>
  renderItem: (item: T) => ReactNode
  renderSummary?: (data: T[]) => ReactNode
  buildInput: (values: Record<string, string>) => TInput
  fields: FormField[]
  addLabel: string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyMessage: string
  itemKey: (item: T) => string
  onAdd?: () => void
  testID?: string
}

export function TrackerScreen<T, TInput>({
  title,
  useData,
  renderItem,
  renderSummary,
  buildInput,
  fields,
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
  const { data, isLoading, error, refresh, create } = useData()
  const [addVisible, setAddVisible] = useState(false)

  const handleAdd = useCallback(() => {
    if (onAdd) {
      onAdd()
      return
    }
    setAddVisible(true)
  }, [onAdd])

  const handleSubmit = useCallback(
    async (values: Record<string, string>) => {
      try {
        const input = buildInput(values)
        await create(input)
        setAddVisible(false)
      } catch (err) {
        // Swallow validation errors; the service call will surface via the list error
      }
    },
    [buildInput, create]
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
      <TrackerHeader title={title} onAdd={onAdd || data.length > 0 ? handleAdd : undefined} addLabel={addLabel} />

      {error ? (
        <TrackerErrorState message={error} onRetry={refresh} testID={`${testID}-error`} />
      ) : data.length === 0 ? (
        <TrackerEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          message={emptyMessage}
          actionLabel={addLabel}
          onAction={handleAdd}
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

      {data.length > 0 && !onAdd ? (
        <View style={styles.fab} pointerEvents="box-none">
          <ScalePress onPress={handleAdd} scale={0.96} testID={`${testID}-fab`}>
            <View style={[styles.fabButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.fabText, { color: colors.surface }]}>{addLabel}</Text>
            </View>
          </ScalePress>
        </View>
      ) : null}

      <AddRecordSheet
        visible={addVisible}
        title={addLabel}
        fields={fields}
        onClose={() => setAddVisible(false)}
        onSubmit={handleSubmit}
        testID={`${testID}-sheet`}
      />
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
