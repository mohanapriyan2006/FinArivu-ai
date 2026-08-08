import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface Option<T> {
  value: T
  label: string
}

interface OptionSelectorProps<T> {
  options: Option<T>[]
  selected: T | undefined
  onSelect: (value: T) => void
  label?: string
  layout?: 'row' | 'wrap'
  testID?: string
}

export function OptionSelector<T>({
  options,
  selected,
  onSelect,
  label,
  layout = 'wrap',
  testID,
}: OptionSelectorProps<T>) {
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
          flexWrap: 'wrap',
          gap: 10,
        },
        option: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          minHeight: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        selectedOption: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryBackground,
        },
        optionText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.medium,
          color: colors.textPrimary,
        },
        selectedOptionText: {
          color: colors.primary,
          fontWeight: Typography.fontWeights.semibold,
        },
      }),
    [colors]
  )

  return (
    <View style={styles.container} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, layout === 'row' && { flexWrap: 'nowrap' }]}>
        {options.map((option) => {
          const isSelected = selected === option.value
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onSelect(option.value)}
              style={[styles.option, isSelected && styles.selectedOption]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
              testID={testID ? `${testID}-option-${String(option.value)}` : undefined}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
