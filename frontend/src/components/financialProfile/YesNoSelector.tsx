import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface YesNoSelectorProps {
  value: boolean | undefined
  onChange: (value: boolean) => void
  label?: string
  testID?: string
}

export function YesNoSelector({
  value,
  onChange,
  label,
  testID,
}: YesNoSelectorProps) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
        },
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
          marginBottom: 12,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        button: {
          flex: 1,
          height: 52,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        selected: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryBackground,
        },
        text: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
        },
        selectedText: {
          color: colors.primary,
        },
      }),
    [colors]
  )

  return (
    <View style={styles.container} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {[
          { label: 'Yes', option: true },
          { label: 'No', option: false },
        ].map(({ label, option }) => {
          const isSelected = value === option
          return (
            <Pressable
              key={label}
              onPress={() => onChange(option)}
              style={[styles.button, isSelected && styles.selected]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              testID={testID ? `${testID}-${label.toLowerCase()}` : undefined}
            >
              <Text style={[styles.text, isSelected && styles.selectedText]}>
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
