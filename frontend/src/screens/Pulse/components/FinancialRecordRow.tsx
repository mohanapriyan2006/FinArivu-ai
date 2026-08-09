import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface FinancialRecordRowProps {
  icon: LucideIcon
  iconColor: string
  iconBackground: string
  title: string
  subtitle?: string
  trailing?: string
  onPress?: () => void
  testID?: string
}

export function FinancialRecordRow({
  icon: Icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  trailing,
  onPress,
  testID,
}: FinancialRecordRowProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
        <Icon size={22} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      <ChevronRight size={18} color={colors.textSecondary} />
    </Pressable>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: Typography.bodySmall.fontSize,
      lineHeight: Typography.bodySmall.lineHeight,
      color: colors.textSecondary,
    },
    trailing: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      fontWeight: '700',
      color: colors.textPrimary,
      marginRight: 8,
    },
  })
