import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { ChevronRight, FileUp } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'
import type { ImportPreviewCard } from '@/types/imports'

interface Props {
  /** Raw `data_import_card` artifact content. */
  data: Record<string, unknown>
}

/** Compact copilot artifact — import status + counts + open review. */
export function ImportCard({ data }: Props) {
  const { colors } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const card = data as unknown as ImportPreviewCard
  const counts = card.counts ?? {}
  const batchId = typeof card.batchId === 'string' ? card.batchId : undefined
  const isReview = card.status === 'REVIEW_REQUIRED'

  const open = () => {
    if (batchId && card.status !== 'FAILED') {
      navigation.navigate('ImportReview', { batchId })
    } else {
      navigation.navigate('ImportCenter')
    }
  }

  const statusLabel =
    card.status === 'NEEDS_DOCUMENT'
      ? 'Upload a document to begin'
      : card.status === 'DUPLICATE_IMPORT'
        ? 'Already imported'
        : card.status === 'FAILED'
          ? "Couldn't import this document"
          : 'Ready for your review'

  return (
    <View style={styles.card} testID="import-card">
      <View style={styles.header}>
        <FileUp size={14} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.title}>Document import</Text>
        {card.documentType ? (
          <View style={[styles.badge, { backgroundColor: colors.primary + '1A' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {String(card.documentType).replace(/_/g, ' ').toLowerCase()}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.status} numberOfLines={2}>
        {card.fileName ? `${card.fileName} — ` : ''}
        {statusLabel}
      </Text>

      {isReview ? (
        <View style={styles.countsRow}>
          {typeof counts.changes === 'number' ? (
            <Text style={styles.count}>
              <Text style={[styles.countNum, { color: colors.textHero }]}>
                {counts.changes}
              </Text>
              {' changes'}
            </Text>
          ) : null}
          {typeof counts.duplicates === 'number' && counts.duplicates > 0 ? (
            <Text style={styles.count}>
              <Text style={[styles.countNum, { color: colors.warning }]}>
                {counts.duplicates}
              </Text>
              {' duplicates'}
            </Text>
          ) : null}
          {typeof counts.needsReview === 'number' && counts.needsReview > 0 ? (
            <Text style={styles.count}>
              <Text style={[styles.countNum, { color: colors.warning }]}>
                {counts.needsReview}
              </Text>
              {' to check'}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Pressable
        style={styles.open}
        onPress={open}
        accessibilityRole="button"
        testID="import-card-open"
      >
        <Text style={[styles.openText, { color: colors.primary }]}>
          {batchId ? 'Review import' : 'Open Import Center'}
        </Text>
        <ChevronRight size={14} color={colors.primary} />
      </Pressable>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      ...Typography.titleSmall,
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
      flex: 1,
    },
    badge: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      ...Typography.labelSmall,
      fontWeight: '600',
      fontSize: 10,
      textTransform: 'capitalize',
    },
    status: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
    },
    countsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    count: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
    },
    countNum: {
      fontWeight: '700',
    },
    open: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    openText: {
      ...Typography.labelSmall,
      fontWeight: '600',
      fontSize: 12,
    },
  })
