import { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
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
  testID?: string
}

export function AuthInput({
  leadingIcon: LeadingIcon,
  trailingAction,
  isPassword,
  testID,
  secureTextEntry,
  ...textInputProps
}: AuthInputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          height: 56,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isFocused ? colors.primary : colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          gap: 12,
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
    [colors.border, colors.primary, colors.surface, colors.textPrimary, isFocused]
  )

  return (
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
  )
}
