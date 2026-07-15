import { useMemo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowRight, LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface PrimaryButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  icon?: LucideIcon
  disabled?: boolean
  testID?: string
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  icon: Icon,
  disabled,
  testID,
}: PrimaryButtonProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          height: 52,
          borderRadius: 18,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.6 : 1,
        },
        text: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.surface,
        },
      }),
    [colors.primary, colors.surface, disabled]
  )

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { transform: [{ scale: pressed && !disabled ? 0.97 : 1 }] },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <>
          <Text style={styles.text}>{title}</Text>
          {Icon && <Icon size={20} color={colors.surface} strokeWidth={2} />}
        </>
      )}
    </Pressable>
  )
}

export function ArrowPrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  testID,
}: Omit<PrimaryButtonProps, 'icon'>) {
  return (
    <PrimaryButton
      title={title}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={ArrowRight}
      testID={testID}
    />
  )
}
