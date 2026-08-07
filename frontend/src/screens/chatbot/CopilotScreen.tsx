import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/ThemeContext'
import {
  sendCopilotMessage,
  type CopilotChatResponse,
} from '@/services/ChatService'
import { CopilotHeader } from '@/components/chatbot/CopilotHeader'
import { CopilotWelcome } from '@/components/chatbot/CopilotWelcome'
import {
  DocMessageItem,
  type ChatMessageItemData,
} from '@/components/chatbot/DocMessageItem'
import { CopilotInput } from '@/components/chatbot/CopilotInput'
import { ThinkingAnimation } from '@/components/chatbot/ThinkingAnimation'

const THINKING_STEPS = [
  'Planning analysis...',
  'Checking budget & transaction data...',
  'Running Tax Engine calculations...',
  'Evaluating goal projections...',
  'Synthesizing Personal CFO response...',
]

export default function CopilotScreen({ navigation }: any) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  // State
  const [messages, setMessages] = useState<ChatMessageItemData[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(THINKING_STEPS[0])
  const [sessionId] = useState(() => `session_${Date.now()}`)

  const flatListRef = useRef<FlatList>(null)
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [])

  // Dynamic thinking step rotation animation
  useEffect(() => {
    if (isLoading) {
      let stepIdx = 0
      setThinkingStep(THINKING_STEPS[0])
      stepTimerRef.current = setInterval(() => {
        stepIdx = (stepIdx + 1) % THINKING_STEPS.length
        setThinkingStep(THINKING_STEPS[stepIdx])
      }, 1400)
    } else {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current)
      }
    }
    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current)
      }
    }
  }, [isLoading])

  // Handler for sending messages
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text || isLoading) return

    setInputText('')

    // 1. Add User Message
    const userMsg: ChatMessageItemData = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    scrollToBottom()

    try {
      // 2. Call backend API endpoint
      const response: CopilotChatResponse = await sendCopilotMessage(sessionId, text)

      // 3. Add AI Message
      const aiMsg: ChatMessageItemData = {
        id: response.messageId || `ai_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        summary: response.summary,
        intent: response.intent,
        agentsUsed: response.agentsUsed,
        data: response.data,
        followUpQuestions: response.followUpQuestions,
        suggestedActions: response.suggestedActions,
        disclaimer: response.disclaimer,
        guardrailTriggered: response.guardrailTriggered,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.warn('Copilot API call failed:', error)

      const errorMsg: ChatMessageItemData = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I am unable to connect to the AI service right now. Please check your connection and try again.',
        intent: 'error',
        data: {},
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <CopilotHeader
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
          isOnline
        />

        {/* Keyboard Avoiding Message Feed */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {messages.length === 0 ? (
            <CopilotWelcome
              onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
            />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DocMessageItem
                  item={item}
                  onSelectFollowUp={(chipText) => handleSendMessage(chipText)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              ListFooterComponent={
                isLoading ? <ThinkingAnimation stepText={thinkingStep} /> : null
              }
            />
          )}

          {/* Floating Glass Bottom Input */}
          <CopilotInput
            value={inputText}
            onChangeText={setInputText}
            onSend={() => handleSendMessage()}
            disabled={isLoading}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}


const makeStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    listContent: {
      paddingVertical: 16,
      paddingBottom: 150,
    },
  })
