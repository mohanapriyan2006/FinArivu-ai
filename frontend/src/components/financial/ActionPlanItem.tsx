import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface ActionPlanItemProps {
  icon: LucideIcon
  variant: 'primary' | 'danger' | 'success'
  title: string
  subtitle: string
  onPress?: () => void
}

export function ActionPlanItem({
  icon: Icon,
  variant,
  title,
  subtitle,
  onPress,
}: ActionPlanItemProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const iconColors = {
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
  }

  const iconBackgrounds = {
    primary: colors.primaryBackground,
    danger: colors.dangerBackground,
    success: colors.successBackground,
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: iconBackgrounds[variant] },
        ]}
      >
        <Icon size={22} color={iconColors[variant]} strokeWidth={2} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={colors.textTertiary} />
    </Pressable>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    pressed: {
      opacity: 0.8,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      marginHorizontal: 12,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
  })
