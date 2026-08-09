import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, type LucideIcon } from 'lucide-react-native'

import { ProgressBar } from '@/components/insights/Common'
import { ScalePress } from '@/components/animation/ScalePress'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PulseFinanceItem } from '@/screens/Pulse/types'

type ColorKey = PulseFinanceItem['iconColor']
type BackgroundKey = PulseFinanceItem['iconBackground']

function resolveColor(key: string, colors: ThemeColors): string {
  switch (key) {
    case 'primary':
      return colors.primary
    case 'success':
      return colors.success
    case 'warning':
      return colors.warning
    case 'danger':
      return colors.danger
    case 'secondary':
      return colors.secondary
    case 'textSecondary':
      return colors.textSecondary
    default:
      return colors.primary
  }
}

function resolveBackground(key: string, colors: ThemeColors): string {
  switch (key) {
    case 'primaryBackground':
      return colors.primaryBackground
    case 'successBackground':
      return colors.successBackground
    case 'accentBackground':
      return colors.accentBackground
    case 'dangerBackground':
      return colors.dangerBackground
    case 'surface':
      return colors.surface
    default:
      return colors.primaryBackground
  }
}

function resolveProgressColor(status: PulseFinanceItem['status'], colors: ThemeColors): string {
  switch (status) {
    case 'attention':
      return colors.danger
    case 'warning':
      return colors.warning
    case 'empty':
      return colors.textSecondary
    case 'normal':
    default:
      return colors.primary
  }
}

interface FinanceControlRowProps {
  item: PulseFinanceItem
  onPress: () => void
  testID?: string
}

export function FinanceControlRow({ item, onPress, testID }: FinanceControlRowProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const iconColor = resolveColor(item.iconColor, colors)
  const iconBg = resolveBackground(item.iconBackground, colors)
  const progressColor = resolveProgressColor(item.status, colors)
  const Icon = item.icon as LucideIcon

  const valueColor =
    item.status === 'attention'
      ? colors.danger
      : item.status === 'warning'
      ? colors.warning
      : colors.textPrimary

  return (
    <ScalePress
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
    >
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Icon size={22} color={iconColor} strokeWidth={2} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>

          <View style={styles.trailing}>
            {item.value ? (
              <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
                {item.value}
              </Text>
            ) : null}
            <Pressable
              onPress={onPress}
              style={styles.chevronBox}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}`}
            >
              <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {typeof item.progress === 'number' && item.progress > 0 ? (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={item.progress}
              fillColor={progressColor}
              trackColor={colors.border}
              height={6}
              delay={100}
            />
          </View>
        ) : null}
      </View>
    </ScalePress>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 20,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    content: {
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
    subtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    value: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      marginRight: 4,
      maxWidth: 120,
    },
    chevronBox: {
      width: 32,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressContainer: {
      marginTop: 12,
    },
  })
