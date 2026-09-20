import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { ScalePress } from '@/components/animation/ScalePress'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PulseQuickAction } from '@/screens/Pulse/types'

interface PulseQuickActionsProps {
  actions: PulseQuickAction[]
  onAction: (action: PulseQuickAction) => void
  testID?: string
}

export function PulseQuickActions({ actions, onAction, testID }: PulseQuickActionsProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      testID={testID}
    >
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <ScalePress
            key={action.id}
            onPress={() => onAction(action)}
            testID={`${testID ? `${testID}-` : ''}${action.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Add ${action.label}`}
            scale={0.96}
          >
            <View style={styles.chip}>
              <View style={[styles.iconBox, { backgroundColor: colors.primaryBackground }]}>
                <Icon size={16} color={colors.primary} strokeWidth={2.25} />
              </View>
              <Text style={styles.label}>{action.label}</Text>
            </View>
          </ScalePress>
        )
      })}
    </ScrollView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 4,
      gap: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      minWidth: 110,
    },
    iconBox: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
  })
