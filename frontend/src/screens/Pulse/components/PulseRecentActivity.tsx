import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PulseRecentActivity } from '@/screens/Pulse/types'

type ColorKey = 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'textSecondary'
type BackgroundKey = 'primaryBackground' | 'successBackground' | 'accentBackground' | 'dangerBackground' | 'surface'

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

interface PulseRecentActivityProps {
  activities: PulseRecentActivity[]
  testID?: string
}

export function PulseRecentActivity({ activities, testID }: PulseRecentActivityProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {activities.map((item, index) => {
        const Icon = item.icon as LucideIcon
        return (
          <View
            key={item.id}
            style={[
              styles.row,
              index === activities.length - 1 ? styles.rowLast : undefined,
            ]}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: resolveBackground(item.iconBackground, colors) },
              ]}
            >
              <Icon
                size={20}
                color={resolveColor(item.iconColor, colors)}
                strokeWidth={2}
              />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
            <View style={styles.right}>
              {item.amount ? (
                <Text style={[styles.amount, { color: colors.danger }]}>
                  -{item.amount}
                </Text>
              ) : null}
              <Text style={styles.date}>{item.dateLabel}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 8,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    text: {
      flex: 1,
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
    right: {
      alignItems: 'flex-end',
      marginLeft: 8,
    },
    amount: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      marginBottom: 2,
    },
    date: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
  })
