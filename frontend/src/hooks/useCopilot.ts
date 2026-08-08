import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCopilotHistory,
  sendCopilotMessage,
  streamCopilotMessage,
  type CopilotChatResponse,
  type CopilotHistoryMessage,
} from '@/services/ChatService'
import type { ChatMessageItemData } from '@/components/chatbot/DocMessageItem'

const THINKING_STEPS = [
  'Planning analysis...',
  'Checking budget & transaction data...',
  'Running Tax Engine calculations...',
  'Evaluating goal projections...',
  'Synthesizing Personal CFO response...',
]

export interface UseCopilotOptions {
  token?: string
  initialMessages?: ChatMessageItemData[]
}

export interface UseCopilotReturn {
  messages: ChatMessageItemData[]
  isLoading: boolean
  isStreaming: boolean
  thinkingStep: string
  error: string | null
  isOnline: boolean
  sessionId: string
  sendMessage: (text: string, contextHints?: string[]) => Promise<void>
  sendStream: (text: string, contextHints?: string[]) => void
  retry: () => Promise<void>
  loadHistory: (skip?: number, limit?: number) => Promise<void>
  setOnline: (online: boolean) => void
}

export function useCopilot({ token, initialMessages = [] }: UseCopilotOptions = {}): UseCopilotReturn {
  const [messages, setMessages] = useState<ChatMessageItemData[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(THINKING_STEPS[0])
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [lastFailedText, setLastFailedText] = useState<string | null>(null)

  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Rotate thinking step while loading.
  useEffect(() => {
    if (isLoading || isStreaming) {
      let stepIdx = 0
      setThinkingStep(THINKING_STEPS[0])
      stepTimerRef.current = setInterval(() => {
        stepIdx = (stepIdx + 1) % THINKING_STEPS.length
        setThinkingStep(THINKING_STEPS[stepIdx])
      }, 1400)
    } else {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    }
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    }
  }, [isLoading, isStreaming])

  const appendMessage = useCallback((message: ChatMessageItemData) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const buildAssistantMessage = useCallback((response: CopilotChatResponse): ChatMessageItemData => ({
    id: response.messageId || `ai_${Date.now()}`,
    role: 'assistant',
    content: response.message,
    summary: response.summary,
    responseType: response.responseType,
    intent: response.intent,
    agentsUsed: response.agentsUsed,
    data: response.data,
    artifacts: response.artifacts,
    recommendations: response.recommendations,
    followUpQuestions: response.followUpQuestions,
    suggestedActions: response.suggestedActions,
    disclaimer: response.disclaimer,
    guardrailTriggered: response.guardrailTriggered,
    createdAt: new Date().toISOString(),
  }), [])

  const sendMessage = useCallback(
    async (text: string, contextHints: string[] = []) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading || isStreaming) return

      setError(null)
      setLastFailedText(null)
      setIsLoading(true)

      const userMsg: ChatMessageItemData = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }
      appendMessage(userMsg)

      try {
        const response = await sendCopilotMessage(sessionId, trimmed, contextHints)
        appendMessage(buildAssistantMessage(response))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to connect to the AI service.'
        setError(message)
        setLastFailedText(trimmed)
        appendMessage({
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I am unable to connect to the AI service right now. Please check your connection and try again.',
          intent: 'error',
          data: {},
          createdAt: new Date().toISOString(),
        })
      } finally {
        setIsLoading(false)
      }
    },
    [appendMessage, buildAssistantMessage, isLoading, isStreaming, sessionId]
  )

  const sendStream = useCallback(
    (text: string, contextHints: string[] = []) => {
      if (!token) {
        setError('No authentication token available for streaming.')
        return
      }
      const trimmed = text.trim()
      if (!trimmed || isLoading || isStreaming) return

      setError(null)
      setIsStreaming(true)

      const userMsg: ChatMessageItemData = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }
      appendMessage(userMsg)

      let streamedText = ''
      const sse = streamCopilotMessage(sessionId, trimmed, contextHints, token)

      sse.addEventListener('message', (event: any) => {
        const payload = event?.data ? JSON.parse(event.data) : null
        if (payload?.event === 'token') {
          streamedText += payload.data
        }
        if (payload?.event === 'done') {
          sse.close()
          setIsStreaming(false)
        }
      })

      sse.addEventListener('error', (event: any) => {
        const message = event?.message || 'Streaming failed. Please try again.'
        setError(message)
        setLastFailedText(trimmed)
        setIsStreaming(false)
      })

      ;(sse as any).connect()
    },
    [appendMessage, isLoading, isStreaming, sessionId, token]
  )

  const retry = useCallback(async () => {
    if (lastFailedText) {
      await sendMessage(lastFailedText)
    }
  }, [lastFailedText, sendMessage])

  const loadHistory = useCallback(
    async (skip = 0, limit = 50) => {
      try {
        const history = await getCopilotHistory(sessionId, skip, limit)
        const mapped: ChatMessageItemData[] = history.map((h: CopilotHistoryMessage) => ({
          id: h.id,
          role: h.role as 'user' | 'assistant',
          content: h.content,
          intent: h.intent || undefined,
          createdAt: h.createdAt || new Date().toISOString(),
        }))
        setMessages((prev) => [...mapped, ...prev])
      } catch (err) {
        console.warn('Failed to load copilot history:', err)
      }
    },
    [sessionId]
  )

  const setOnline = useCallback((online: boolean) => {
    setIsOnline(online)
  }, [])

  return {
    messages,
    isLoading,
    isStreaming,
    thinkingStep,
    error,
    isOnline,
    sessionId,
    sendMessage,
    sendStream,
    retry,
    loadHistory,
    setOnline,
  }
}
