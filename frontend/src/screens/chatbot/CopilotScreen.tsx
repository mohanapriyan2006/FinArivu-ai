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
        intent: response.intent,
        agentsUsed: response.agentsUsed,
        data: response.data,
        disclaimer: response.disclaimer,
        guardrailTriggered: response.guardrailTriggered,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.warn('Copilot API call failed, falling back to offline simulation:', error)

      // Graceful offline fallback simulation
      const fallbackIntent = detectLocalIntent(text)
      const fallbackMsg: ChatMessageItemData = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: getLocalFallbackText(fallbackIntent, text),
        intent: fallbackIntent,
        data: getLocalFallbackData(fallbackIntent),
        disclaimer: 'The information provided is for educational purposes only.',
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, fallbackMsg])
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

// ── LOCAL FALLBACK HELPERS ──────────────────────────────────────────────
function detectLocalIntent(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('budget') || q.includes('spend')) return 'budget_analysis'
  if (q.includes('tax') || q.includes('regime') || q.includes('80c')) return 'tax_planning'
  if (q.includes('goal') || q.includes('house') || q.includes('car')) return 'goal_tracking'
  if (q.includes('retire') || q.includes('pension')) return 'retirement_planning'
  if (q.includes('health') || q.includes('score')) return 'health_score'
  return 'general'
}

function getLocalFallbackText(intent: string, query: string): string {
  switch (intent) {
    case 'budget_analysis':
      return 'I have analyzed your monthly budget. Your overall utilization is at 88%, but Food & Dining has exceeded its allocation by 18%. Here is your breakdown:'
    case 'tax_planning':
      return 'Based on your gross annual income, here is the comparison between the Old and New Tax Regimes. Switching to the New Regime will save you ₹9,000 in tax outgo:'
    case 'goal_tracking':
      return 'You are making steady progress on your House Deposit goal. At your current rate, saving ₹12,500/month will keep you exactly on track for your 5-year target:'
    case 'retirement_planning':
      return 'To maintain your current standard of living adjusted for 6% inflation, your target retirement corpus is projected at ₹4.32 Cr over 25 years:'
    case 'health_score':
      return 'Your Financial Health Score is currently 82/100 (Excellent). You have an ideal debt ratio and strong emergency fund coverage:'
    default:
      return `I am FinArivu AI, your Personal CFO. I analyzed your query "${query}". How else can I assist with your finances today?`
  }
}

function getLocalFallbackData(intent: string): Record<string, any> {
  switch (intent) {
    case 'budget_analysis':
      return {
        BudgetAgent: {
          totalBudget: 50000,
          totalSpent: 44000,
          overspendCategory: 'Food & Dining',
          overspendAmount: 6500,
          overspendPercentage: 18,
        },
      }
    case 'tax_planning':
      return {
        TaxAgent: {
          oldRegimeTax: 52000,
          newRegimeTax: 43000,
          savings: 9000,
          betterRegime: 'new',
        },
      }
    case 'goal_tracking':
      return {
        GoalAgent: {
          goalName: 'House Deposit',
          progressPercentage: 42,
          targetAmount: 2500000,
          currentAmount: 1050000,
          monthlyRequired: 12500,
          status: 'on_track',
        },
      }
    case 'retirement_planning':
      return {
        RetirementAgent: {
          corpusRequired: 43200000,
          yearsRemaining: 25,
          futureMonthlyExpense: 180000,
        },
      }
    case 'health_score':
      return {
        HealthAgent: {
          overallScore: 82,
          savingsScore: 25,
          emergencyScore: 15,
          debtScore: 20,
          status: 'Excellent',
        },
      }
    default:
      return {}
  }
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
