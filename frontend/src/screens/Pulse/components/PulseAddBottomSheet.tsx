import { useMemo } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { ScalePress } from '@/components/animation/ScalePress'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PulseQuickAction } from '@/screens/Pulse/types'

interface PulseAddBottomSheetProps {
  visible: boolean
  actions: PulseQuickAction[]
  onSelect: (action: PulseQuickAction) => void
  onClose: () => void
  testID?: string
}

export function PulseAddBottomSheet({
  visible,
  actions,
  onSelect,
  onClose,
  testID,
}: PulseAddBottomSheetProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <Modal
      testID={testID}
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add to FinArivu</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <ScalePress
                    key={action.id}
                    onPress={() => onSelect(action)}
                    testID={`${testID ? `${testID}-` : ''}${action.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${action.label}`}
                    scale={0.97}
                  >
                    <View style={styles.item}>
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: colors.primaryBackground },
                        ]}
                      >
                        <Icon size={26} color={colors.primary} strokeWidth={2} />
                      </View>
                      <Text style={styles.itemLabel} numberOfLines={2} ellipsizeMode="tail">
                        {action.label}
                      </Text>
                    </View>
                  </ScalePress>
                )
              })}
            </View>

            <Pressable
              style={styles.cancel}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingBottom: 28,
      maxHeight: '80%',
    },
    scroll: {
      paddingHorizontal: 20,
    },
    content: {
      paddingBottom: 20,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h3,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 20,
      textAlign: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    item: {
      width: '48%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.background,
      marginBottom: 12,
      minHeight: 96,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    itemLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    cancel: {
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    cancelText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
  })
