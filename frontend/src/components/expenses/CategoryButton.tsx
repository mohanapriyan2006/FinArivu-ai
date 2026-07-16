import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface CategoryButtonProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  iconColor: string
  backgroundColor: string
  onPress: () => void
}

export function CategoryButton({
  icon: Icon,
  label,
  isActive,
  iconColor,
  backgroundColor,
  onPress,
}: CategoryButtonProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        isActive && styles.buttonActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconContainer}>
        <Icon size={24} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
    </Pressable>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonActive: {
      borderColor: colors.primary,
    },
    pressed: {
      opacity: 0.9,
    },
    iconContainer: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginTop: 8,
    },
    labelActive: {
      color: colors.textPrimary,
      fontWeight: Typography.fontWeights.semibold,
    },
  })
