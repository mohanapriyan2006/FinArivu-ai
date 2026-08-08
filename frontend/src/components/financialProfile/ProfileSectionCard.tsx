import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface ProfileSectionCardProps {
  icon: LucideIcon
  title: string
  description: string
  complete: boolean
  onPress?: () => void
  testID?: string
}

export function ProfileSectionCard({
  icon: Icon,
  title,
  description,
  complete,
  onPress,
  testID,
}: ProfileSectionCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: complete ? colors.success : colors.border,
          marginBottom: 12,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        },
        iconBox: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: complete ? colors.successBackground : colors.primaryBackground,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        },
        text: {
          flex: 1,
          justifyContent: 'center',
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
          marginBottom: 2,
        },
        description: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
        },
        badge: {
          marginLeft: 8,
        },
      }),
    [colors, complete]
  )

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed && onPress ? 0.85 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
    >
      <View style={styles.iconBox}>
        <Icon
          size={22}
          color={complete ? colors.success : colors.primary}
          strokeWidth={2}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.badge}>
        {complete ? (
          <CheckCircle2 size={22} color={colors.success} strokeWidth={2.5} />
        ) : (
          <ChevronRight size={22} color={colors.textSecondary} strokeWidth={2} />
        )}
      </View>
    </Pressable>
  )
}
