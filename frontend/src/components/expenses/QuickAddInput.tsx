import { useMemo, useState } from 'react'
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface QuickAddInputProps extends TextInputProps {
  icon: LucideIcon
}

export function QuickAddInput({ icon: Icon, ...textInputProps }: QuickAddInputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const styles = useMemo(
    () => makeStyles(colors, isFocused),
    [colors, isFocused]
  )

  return (
    <View style={styles.wrapper}>
      {Icon && (
        <View style={styles.icon}>
          <Icon size={20} color={colors.textSecondary} strokeWidth={2} />
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
        {...textInputProps}
      />
    </View>
  )
}

const makeStyles = (colors: ThemeColors, isFocused: boolean) =>
  StyleSheet.create({
    wrapper: {
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isFocused ? colors.primary : colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 12,
    },
    icon: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      height: '100%',
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textPrimary,
      padding: 0,
    },
  })
