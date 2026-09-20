import { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native'
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface AuthInputProps extends TextInputProps {
  leadingIcon?: LucideIcon
  trailingAction?: React.ReactNode
  isPassword?: boolean
  error?: string | null
  testID?: string
}

export function AuthInput({
  leadingIcon: LeadingIcon,
  trailingAction,
  isPassword,
  error,
  testID,
  secureTextEntry,
  ...textInputProps
}: AuthInputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const hasError = !!error

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          height: 56,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: hasError
            ? colors.danger
            : isFocused
              ? colors.primary
              : colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          gap: 12,
        },
        errorText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.regular,
          color: colors.danger,
          marginTop: 6,
          marginLeft: 4,
        },
        input: {
          flex: 1,
          height: '100%',
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textPrimary,
        },
        icon: {
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
        },
        visibilityButton: {
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [
      colors.border,
      colors.danger,
      colors.primary,
      colors.surface,
      colors.textPrimary,
      hasError,
      isFocused,
    ]
  )

  return (
    <View>
      <View style={styles.wrapper} testID={testID}>
      {LeadingIcon && (
        <View style={styles.icon}>
          <LeadingIcon
            size={22}
            color={colors.textSecondary}
            strokeWidth={2}
          />
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textTertiary}
        onFocus={(e) => {
          setIsFocused(true)
          textInputProps.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          textInputProps.onBlur?.(e)
        }}
        secureTextEntry={isPassword ? !isVisible : secureTextEntry}
        {...textInputProps}
      />
      {isPassword && (
        <Pressable
          style={styles.visibilityButton}
          onPress={() => setIsVisible((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? (
            <Eye size={22} color={colors.textSecondary} strokeWidth={2} />
          ) : (
            <EyeOff size={22} color={colors.textSecondary} strokeWidth={2} />
          )}
        </Pressable>
      )}
        {!isPassword && trailingAction}
      </View>
      {hasError && (
        <Text
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          testID={testID ? `${testID}-error` : undefined}
        >
          {error}
        </Text>
      )}
    </View>
  )
}
