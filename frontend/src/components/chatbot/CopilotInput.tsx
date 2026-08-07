import React, { useEffect, useMemo } from 'react'
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { ArrowUp, Mic, Paperclip, Plus } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface CopilotInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
}

export function CopilotInput({
  value,
  onChangeText,
  onSend,
  placeholder = 'Ask your Personal CFO anything...',
  disabled = false,
}: CopilotInputProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const sendScale = useSharedValue(value.trim() ? 1.0 : 0.85)

  useEffect(() => {
    sendScale.value = withSpring(value.trim() ? 1.0 : 0.85, {
      damping: 15,
      stiffness: 200,
    })
  }, [value, sendScale])

  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }))

  const canSend = value.trim().length > 0 && !disabled

  return (
    <View style={styles.floatingContainer}>
      {/* Plus / Attachment Action Button */}
      <Pressable
        style={styles.actionIconButton}
        accessibilityRole="button"
        accessibilityLabel="Add attachment"
      >
        <Plus size={20} color={colors.textSecondary} strokeWidth={2.2} />
      </Pressable>

      {/* Main Input Field */}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        editable={!disabled}
        onSubmitEditing={canSend ? onSend : undefined}
        returnKeyType="send"
        blurOnSubmit={false}
      />

      {/* Voice Mic Button */}
      {!value.trim() && (
        <Pressable
          style={styles.actionIconButton}
          accessibilityRole="button"
          accessibilityLabel="Voice input"
        >
          <Mic size={18} color={colors.textSecondary} strokeWidth={2.2} />
        </Pressable>
      )}

      {/* Send Button */}
      <Animated.View style={sendAnimatedStyle}>
        <Pressable
          style={[
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
          ]}
          onPress={canSend ? onSend : undefined}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <ArrowUp
            size={18}
            color="#FFFFFF"
            strokeWidth={2.5}
          />
        </Pressable>
      </Animated.View>
    </View>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    floatingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 28,
      paddingHorizontal: 10,
      paddingVertical: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
      marginHorizontal: 16,
      marginBottom: 80,
      gap: 6,
    },
    actionIconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    textInput: {
      flex: 1,
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
      maxHeight: 90,
      fontSize: 14,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    sendButtonDisabled: {
      backgroundColor: colors.textTertiary,
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
  })
