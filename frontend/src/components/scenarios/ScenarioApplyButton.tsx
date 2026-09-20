import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { ArrowRight } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import type { ScenarioApplyAction } from '@/types/scenarios'

interface Props {
  apply: ScenarioApplyAction
  /**
   * Bridges to the Phase 1 preview flow — the handler should call
   * `previewAction({ operation, arguments })` and show the returned
   * ActionPreviewCard. This button never mutates data directly.
   */
  onApply: (apply: ScenarioApplyAction) => void | Promise<void>
}

/** Apply-a-scenario bridge — always routes through action preview/confirm. */
export function ScenarioApplyButton({ apply, onApply }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [busy, setBusy] = useState(false)

  const handle = async () => {
    setBusy(true)
    try {
      await onApply(apply)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={handle}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={apply.label}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.onPrimary} />
      ) : (
        <>
          <Text style={styles.text}>{apply.label}</Text>
          <ArrowRight size={14} color={colors.onPrimary} strokeWidth={2.4} />
        </>
      )}
    </Pressable>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginTop: 12,
      alignSelf: 'flex-start',
    },
    pressed: { opacity: 0.8 },
    text: {
      ...Typography.labelSmall,
      color: colors.onPrimary,
      fontWeight: '700',
      fontSize: 12,
    },
  })
