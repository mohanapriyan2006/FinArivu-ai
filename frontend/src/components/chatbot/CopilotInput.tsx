import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { ArrowUp, FileText, Mic, Paperclip, X } from 'lucide-react-native'
import * as DocumentPicker from 'expo-document-picker'

// Lazy / safe import for Expo SDK modules that may not be available in Expo Go
let ExpoSpeechRecognitionModule: any = {
  stop: () => {},
  requestPermissionsAsync: async () => ({ granted: false }),
}
let useSpeechRecognitionEvent = (event: string, handler: (e: any) => void) => {}
let isSpeechRecognitionAvailable = false

try {
  const speech = require('expo-speech-recognition')
  ExpoSpeechRecognitionModule = speech.ExpoSpeechRecognitionModule
  useSpeechRecognitionEvent = speech.useSpeechRecognitionEvent
  isSpeechRecognitionAvailable = true
} catch (e) {
  console.warn('expo-speech-recognition is not available in this runtime:', e)
}

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
  onRemoveAttachedFile?: () => void
  attachedFileName?: string
  attachedFileSize?: number
  isExtractingDocument?: boolean
  placeholder?: string
  disabled?: boolean
}

export function CopilotInput({
  value,
  onChangeText,
  onSend,
  onFilePicked,
  onRemoveAttachedFile,
  attachedFileName,
  attachedFileSize,
  isExtractingDocument,
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

  const canSend = (value.trim().length > 0 || !!attachedFileName) && !disabled
  const placeholderText = attachedFileName
    ? `Ask about ${attachedFileName}...`
    : placeholder

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
    if (!isSpeechRecognitionAvailable) {
      Alert.alert(
        'Voice input unavailable',
        'Voice input requires a development build. Use the keyboard or build a custom development client.'
      )
      return
    }
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

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleAttachmentPress = useCallback(async () => {
    if (disabled || isExtractingDocument) return
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
  }, [isExtractingDocument, attachedFileName, onRemoveAttachedFile, onFilePicked])

  return (
    <View style={styles.floatingContainer}>
      {/* ChatGPT-style attachment chip above the input row */}
      {(attachedFileName || isExtractingDocument) && (
        <View style={styles.attachmentChip}>
          <View style={styles.attachmentIcon}>
            {isExtractingDocument ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <FileText size={18} color={colors.primary} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.attachmentInfo}>
            <Text style={styles.attachmentName} numberOfLines={1}>
              {isExtractingDocument ? 'Reading document...' : attachedFileName}
            </Text>
            {!isExtractingDocument && attachedFileSize ? (
              <Text style={styles.attachmentMeta}>{formatSize(attachedFileSize)}</Text>
            ) : null}
          </View>
          {!isExtractingDocument && (
            <Pressable
              style={styles.attachmentRemove}
              onPress={onRemoveAttachedFile}
              accessibilityRole="button"
              accessibilityLabel="Remove attachment"
              hitSlop={8}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={2.4} />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.inputRow}>
      {/* Attachment Action Button */}
      <Pressable
        style={styles.actionIconButton}
        onPress={handleAttachmentPress}
        disabled={disabled || isExtractingDocument}
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
        placeholder={placeholderText}
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      paddingHorizontal: 10,
      paddingVertical: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    attachmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 8,
      marginHorizontal: 4,
      gap: 10,
    },
    attachmentIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachmentInfo: {
      flex: 1,
    },
    attachmentName: {
      ...Typography.bodySmall,
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    attachmentMeta: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 11,
      marginTop: 2,
    },
    attachmentRemove: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
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
