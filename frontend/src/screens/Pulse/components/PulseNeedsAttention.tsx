import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AlertTriangle, ChevronRight } from 'lucide-react-native'

import { ScalePress } from '@/components/animation/ScalePress'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PulseAttentionItem } from '@/screens/Pulse/types'

interface PulseNeedsAttentionProps {
  items: PulseAttentionItem[]
  onPress: (item: PulseAttentionItem) => void
  testID?: string
}

export function PulseNeedsAttention({ items, onPress, testID }: PulseNeedsAttentionProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.sectionTitle}>Needs Attention</Text>
      {items.map((item) => {
        const iconColor = item.severity === 'danger' ? colors.danger : colors.warning
        return (
          <ScalePress
            key={item.id}
            onPress={() => onPress(item)}
            testID={`${testID ? `${testID}-` : ''}${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}: ${item.message}`}
          >
            <View style={styles.card}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                      item.severity === 'danger'
                        ? colors.dangerBackground
                        : colors.accentBackground,
                  },
                ]}
              >
                <AlertTriangle size={20} color={iconColor} strokeWidth={2} />
              </View>
              <View style={styles.text}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message} numberOfLines={2}>
                  {item.message}
                </Text>
              </View>
              <ChevronRight size={20} color={iconColor} strokeWidth={2} />
            </View>
          </ScalePress>
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
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
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
      marginRight: 8,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    message: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
  })
