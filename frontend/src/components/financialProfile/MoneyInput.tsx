import { useMemo, useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import { formatInrNumber, parseInrText } from '@/utils/formatInr'

interface MoneyInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder?: string
  label?: string
  keyboardType?: 'numeric' | 'number-pad'
  prefix?: string
  hasError?: boolean
  errorMessage?: string
  testID?: string
  maxLength?: number
  autoFocus?: boolean
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  label,
  keyboardType = 'number-pad',
  prefix = '₹',
  hasError = false,
  errorMessage,
  testID,
  maxLength = 12,
  autoFocus = false,
}: MoneyInputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  const displayValue = useMemo(() => {
    if (isFocused) {
      return value === undefined || isNaN(value) ? '' : String(value)
    }
    return value === undefined || isNaN(value) ? '' : formatInrNumber(value)
  }, [isFocused, value])

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
          marginBottom: 8,
        },
        wrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 64,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hasError ? colors.danger : isFocused ? colors.primary : colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          gap: 8,
        },
        prefix: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes['2xl'],
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
        },
        input: {
          flex: 1,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes['2xl'],
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
          minHeight: 64,
        },
        error: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.medium,
          color: colors.danger,
          marginTop: 6,
          marginLeft: 4,
        },
      }),
    [colors, hasError, isFocused]
  )

  return (
    <View style={styles.container} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.wrapper}>
        <Text style={styles.prefix}>{prefix}</Text>
        <TextInput
          style={styles.input}
          keyboardType={keyboardType}
          maxLength={maxLength}
          placeholder={isFocused ? placeholder : prefix + '0'}
          placeholderTextColor={colors.textTertiary}
          value={displayValue}
          onChangeText={(input) => {
            const parsed = parseInrText(input)
            onChange(parsed)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
          accessibilityLabel={label ?? 'Money input'}
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>
      {hasError && errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : null}
    </View>
  )
}
