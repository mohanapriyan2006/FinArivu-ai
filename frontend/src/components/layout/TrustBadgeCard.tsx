import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface TrustBadgeCardProps {
  icon: LucideIcon
  iconColor: string
  iconBackground: string
  title: string
  subtitle: string
  testID?: string
}

export function TrustBadgeCard({
  icon: Icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  testID,
}: TrustBadgeCardProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: 20,
          borderRadius: 20,
          backgroundColor: colors.surface,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        iconCircle: {
          width: 44,
          height: 44,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: iconBackground,
        },
        textContainer: {
          flex: 1,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
          marginBottom: 4,
        },
        subtitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
        },
      }),
    [colors.shadowColor, colors.surface, colors.textPrimary, colors.textSecondary, iconBackground]
  )

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.iconCircle}>
        <Icon size={22} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}
