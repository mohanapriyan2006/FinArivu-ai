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
              <Icon size={18} color={colors.primary} strokeWidth={2} />
              <Text style={styles.label}>+ {action.label}</Text>
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      minWidth: 110,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
  })
