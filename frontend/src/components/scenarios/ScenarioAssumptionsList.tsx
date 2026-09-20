import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronDown, ChevronUp, Info } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ScenarioAssumption } from '@/types/scenarios'

interface Props {
  assumptions: ScenarioAssumption[]
}

const SOURCE_LABEL: Record<string, string> = {
  default: 'assumption',
  engine: 'computed',
  user: 'from your data',
}

/** Disclosed assumptions — every material default is surfaced to the user. */
export function ScenarioAssumptionsList({ assumptions }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [expanded, setExpanded] = useState(false)

  if (!assumptions.length) return null

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Toggle assumptions"
      >
        <Info size={12} color={colors.textTertiary} />
        <Text style={styles.headerText}>
          {assumptions.length} assumption{assumptions.length === 1 ? '' : 's'}
        </Text>
        {expanded ? (
          <ChevronUp size={13} color={colors.textTertiary} />
        ) : (
          <ChevronDown size={13} color={colors.textTertiary} />
        )}
      </Pressable>
      {expanded &&
        assumptions.map((a) => (
          <View key={a.key} style={styles.row}>
            <Text style={styles.label}>{a.label}</Text>
            <Text style={styles.value}>
              {typeof a.value === 'object' && a.value !== null
                ? JSON.stringify(a.value)
                : String(a.value ?? '—')}
            </Text>
            <Text style={styles.source}>
              {SOURCE_LABEL[a.source] ?? a.source}
            </Text>
          </View>
        ))}
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerText: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 11,
      flex: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    label: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
      flex: 1,
    },
    value: {
      ...Typography.labelSmall,
      color: colors.textPrimary,
      fontSize: 11,
    },
    source: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 10,
      fontStyle: 'italic',
    },
  })
