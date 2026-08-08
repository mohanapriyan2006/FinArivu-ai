import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, Bot, MoreVertical, Sparkles } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface CopilotHeaderProps {
  onBack?: () => void
  onMenu?: () => void
  isOnline?: boolean
}

export function CopilotHeader({ onBack, onMenu, isOnline = true }: CopilotHeaderProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        )}

        <View style={styles.avatarContainer}>
          <Bot size={20} color="#FFFFFF" strokeWidth={2.2} />
          <View style={styles.sparkleBadge}>
            <Sparkles size={8} color="#FFD700" strokeWidth={2.5} />
          </View>
        </View>

        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>FinArivu AI</Text>
            {isOnline && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitleText}>Personal CFO</Text>
        </View>
      </View>

      {onMenu && (
        <Pressable
          onPress={onMenu}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Open chat menu"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreVertical size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    leftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      paddingRight: 4,
    },
    menuButton: {
      paddingLeft: 4,
    },
    avatarContainer: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    sparkleBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#0B112B',
      borderRadius: 8,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    titleColumn: {
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleText: {
      ...Typography.headlineMedium,
      color: colors.textHero,
      fontWeight: '700',
      fontSize: 17,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 12,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    statusText: {
      ...Typography.labelSmall,
      color: colors.success,
      fontWeight: '600',
      fontSize: 10,
    },
    subtitleText: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      fontSize: 12,
    },
  })
