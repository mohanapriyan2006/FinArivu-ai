import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import { fieldLabel, formatFieldValue, isHiddenField } from './actionFormat'

interface Props {
  /** Field key, e.g. "monthlyLimit". */
  field: string
  before: unknown
  after: unknown
}

/** One row of a before → after diff shown on preview/result cards. */
export function ActionDiffRow({ field, before, after }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  if (isHiddenField(field)) return null

  const same =
    before === after || (before == null && (after == null || after === ''))

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {fieldLabel(field)}
      </Text>
      <View style={styles.values}>
        {before !== undefined && (
          <Text style={[styles.before, same && styles.sameValue]} numberOfLines={1}>
            {formatFieldValue(field, before)}
          </Text>
        )}
        {before !== undefined && !same && (
          <ArrowRight size={12} color={colors.textTertiary} strokeWidth={2.2} />
        )}
        {!same && (
          <Text style={styles.after} numberOfLines={1}>
            {formatFieldValue(field, after)}
          </Text>
        )}
      </View>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 5,
      gap: 8,
    },
    label: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
      flexShrink: 0,
      maxWidth: '45%',
    },
    values: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    before: {
      ...Typography.bodySmall,
      color: colors.textTertiary,
      fontSize: 12,
    },
    sameValue: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    after: {
      ...Typography.bodySmall,
      color: colors.textHero,
      fontSize: 12,
      fontWeight: '700',
    },
  })
