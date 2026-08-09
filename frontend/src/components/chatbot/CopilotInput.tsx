import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { ArrowUp, Mic, Paperclip } from 'lucide-react-native'
import * as DocumentPicker from 'expo-document-picker'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface CopilotInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  onFilePicked?: (file: {
    uri: string
    name: string
    size: number
    mimeType?: string
  }) => void
  placeholder?: string
  disabled?: boolean
}

export function CopilotInput({
  value,
  onChangeText,
  onSend,
  onFilePicked,
  placeholder = 'Ask your Personal CFO anything...',
  disabled = false,
}: CopilotInputProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [isListening, setIsListening] = useState(false)
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

  const appendTranscript = useCallback(
    (transcript: string) => {
      const base = value.trim()
      onChangeText(base ? `${base} ${transcript}` : transcript)
    },
    [value, onChangeText]
  )

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript
    if (!transcript) return

    if (event.isFinal) {
      appendTranscript(transcript)
      setIsListening(false)
      ExpoSpeechRecognitionModule.stop()
    }
  })

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false)
  })

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false)
  })

  const handleMicPress = useCallback(async () => {
    if (isListening) {
      setIsListening(false)
      ExpoSpeechRecognitionModule.stop()
      return
    }

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!granted) {
        Alert.alert(
          'Microphone access needed',
          'Allow microphone and speech recognition to use voice input.'
        )
        return
      }

      setIsListening(true)
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
      })
    } catch (err) {
      console.warn('Speech recognition error:', err)
      setIsListening(false)
    }
  }, [isListening])

  const handleAttachmentPress = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      })

      if (result.canceled || !result.assets?.length) return

      const asset = result.assets[0]
      if ((asset.size ?? 0) > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please select a document under 5 MB.')
        return
      }

      onFilePicked?.({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: asset.mimeType,
      })
    } catch (err) {
      console.warn('Document picker error:', err)
    }
  }, [onFilePicked])

  return (
    <View style={styles.floatingContainer}>
      {/* Attachment Action Button */}
      <Pressable
        style={styles.actionIconButton}
        onPress={handleAttachmentPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Add attachment"
      >
        <Paperclip size={20} color={colors.textSecondary} strokeWidth={2.2} />
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
      <Pressable
        style={[styles.actionIconButton, isListening && styles.listeningButton]}
        onPress={handleMicPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={isListening ? 'Stop listening' : 'Voice input'}
      >
        {isListening ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Mic size={18} color={colors.textSecondary} strokeWidth={2.2} />
        )}
      </Pressable>

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
          <ArrowUp size={18} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
    </View>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    floatingContainer: {
      position: 'absolute',
      bottom: 80,
      right: 10,
      left: 10,
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
    listeningButton: {
      backgroundColor: colors.primarySoft,
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
