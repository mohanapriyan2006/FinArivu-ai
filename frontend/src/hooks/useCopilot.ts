import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteCopilotSession,
  getCopilotHistory,
  getCopilotSessions,
  renameCopilotSession,
  sendCopilotMessage,
  streamCopilotMessage,
  uploadCopilotDocument,
  type CopilotAttachment,
  type CopilotChatResponse,
  type CopilotHistoryMessage,
  type CopilotSession,
} from '@/services/ChatService'
import {
  actionRequestFromPayload,
  cancelAction,
  executeAction,
  previewAction,
  undoAction,
} from '@/services/ActionService'
import type {
  ActionPreview,
  ActionResult,
} from '@/types/actions'
import type { ChatMessageItemData, SuggestedAction } from '@/types/copilot'

const THINKING_STEPS = [
  'Planning analysis...',
  'Checking data...',
  'Running calculations...',
  'Evaluating...',
  'Synthesizing response...',
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
  sessions: CopilotSession[]
  clearMessages: () => void
  newChat: () => void
  sendMessage: (text: string, contextHints?: string[], attachments?: CopilotAttachment[]) => Promise<void>
  extractDocument: (file: { uri: string; name: string; type: string }) => Promise<{ text: string; filename: string }>
  sendStream: (text: string, contextHints?: string[], attachments?: CopilotAttachment[]) => void
  /** Open a server-validated preview for an API_ACTION chip. */
  runApiAction: (action: SuggestedAction) => Promise<void>
  /** Confirm a previewed action — POST /actions/execute. */
  confirmActionPreview: (messageId: string, preview: ActionPreview) => Promise<void>
  /** Cancel a pending preview — POST /actions/{id}/cancel. */
  cancelActionPreview: (messageId: string, preview: ActionPreview) => Promise<void>
  /** Undo an executed action — POST /actions/{id}/undo. */
  undoExecutedAction: (result: ActionResult) => Promise<void>
  retry: () => Promise<void>
  loadHistory: (skip?: number, limit?: number) => Promise<void>
  loadSessions: () => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  renameSession: (sessionId: string, title: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  setOnline: (online: boolean) => void
}

export function useCopilot({ token, initialMessages = [] }: UseCopilotOptions = {}): UseCopilotReturn {
  const [messages, setMessages] = useState<ChatMessageItemData[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(THINKING_STEPS[0])
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`)
  const [lastFailedText, setLastFailedText] = useState<string | null>(null)
  const [sessions, setSessions] = useState<CopilotSession[]>([])

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
    actionPreview: response.actionPreview ?? undefined,
    createdAt: new Date().toISOString(),
  }), [])

  const loadSessions = useCallback(async () => {
    try {
      const list = await getCopilotSessions()
      setSessions(list)
    } catch (err) {
      console.warn('Failed to load copilot sessions:', err)
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string, contextHints: string[] = [], attachments: CopilotAttachment[] = []) => {
      const trimmed = text.trim()
      if ((!trimmed && attachments.length === 0) || isLoading || isStreaming) return

      setError(null)
      setLastFailedText(null)
      setIsLoading(true)

      const userMsg: ChatMessageItemData = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: trimmed,
        attachments: attachments.map((a) => ({ filename: a.filename, mimeType: a.mimeType })),
        createdAt: new Date().toISOString(),
      }
      appendMessage(userMsg)

      try {
        const response = await sendCopilotMessage(sessionId, trimmed, contextHints, attachments)
        appendMessage(buildAssistantMessage(response))
        await loadSessions()
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
    [appendMessage, buildAssistantMessage, isLoading, isStreaming, sessionId, loadSessions]
  )

  const extractDocument = useCallback(
    async (file: { uri: string; name: string; type: string }) => {
      const { text, filename } = await uploadCopilotDocument(file)
      return { text, filename }
    },
    []
  )

  const sendStream = useCallback(
    (text: string, contextHints: string[] = [], attachments: CopilotAttachment[] = []) => {
      if (!token) {
        setError('No authentication token available for streaming.')
        return
      }
      const trimmed = text.trim()
      if ((!trimmed && attachments.length === 0) || isLoading || isStreaming) return

      setError(null)
      setIsStreaming(true)

      const userMsg: ChatMessageItemData = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: trimmed,
        attachments: attachments.map((a) => ({ filename: a.filename, mimeType: a.mimeType })),
        createdAt: new Date().toISOString(),
      }
      appendMessage(userMsg)

      let streamedText = ''
      const streamMsgId = `ai_stream_${Date.now()}`
      const sse = streamCopilotMessage(sessionId, trimmed, contextHints, token, attachments)

      const upsertStreamedMessage = () => {
        setMessages((prev) => {
          const msg: ChatMessageItemData = {
            id: streamMsgId,
            role: 'assistant',
            content: streamedText,
            createdAt: new Date().toISOString(),
          }
          const idx = prev.findIndex((m) => m.id === streamMsgId)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = msg
            return next
          }
          return [...prev, msg]
        })
      }

      // Backend emits named SSE events (token, agent_start, agent_done, data,
      // done, error) — not the default 'message' event. The EventSource
      // connects automatically on construction.
      sse.addEventListener('token', (event) => {
        try {
          const payload = event?.data ? JSON.parse(event.data) : null
          if (payload?.data) {
            streamedText += payload.data
            upsertStreamedMessage()
          }
        } catch {
          // Ignore malformed token payloads.
        }
      })

      sse.addEventListener('agent_start', (event) => {
        try {
          const payload = event?.data ? JSON.parse(event.data) : null
          if (payload?.data) setThinkingStep(String(payload.data))
        } catch {
          // Non-critical progress event.
        }
      })

      sse.addEventListener('done', () => {
        sse.close()
        setIsStreaming(false)
        loadSessions()
      })

      sse.addEventListener('error', (event) => {
        sse.close()
        const message =
          'message' in event && event.message
            ? event.message
            : 'Streaming failed. Please try again.'
        setError(message)
        setLastFailedText(trimmed)
        setIsStreaming(false)
      })
    },
    [appendMessage, isLoading, isStreaming, sessionId, token, loadSessions]
  )

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessageItemData>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      )
    },
    [],
  )

  const runApiAction = useCallback(
    async (action: SuggestedAction) => {
      const request = actionRequestFromPayload(action.payload, sessionId)
      if (!request) {
        appendMessage({
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: "I couldn't understand that action request.",
          createdAt: new Date().toISOString(),
        })
        return
      }
      appendMessage({
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `Preparing "${action.label}"…`,
        createdAt: new Date().toISOString(),
      })
      try {
        const preview = await previewAction(request)
        if (preview.status === 'AWAITING_CONFIRMATION') {
          appendMessage({
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: 'Review the preview below, then confirm or cancel.',
            actionPreview: preview,
            responseType: 'action_preview',
            createdAt: new Date().toISOString(),
          })
        } else {
          appendMessage({
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content:
              preview.clarificationQuestion ||
              'I need a bit more detail to make that change.',
            responseType: 'clarification',
            createdAt: new Date().toISOString(),
          })
        }
      } catch (err) {
        appendMessage({
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'I could not prepare that action right now.',
          createdAt: new Date().toISOString(),
        })
      }
    },
    [appendMessage, sessionId],
  )

  const confirmActionPreview = useCallback(
    async (messageId: string, preview: ActionPreview) => {
      if (!preview.executionId) return
      try {
        const result = await executeAction(preview.executionId, sessionId)
        updateMessage(messageId, { actionPreviewResolved: 'EXECUTED' })
        appendMessage({
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: result.message || 'Done — the change was applied.',
          actionResult: result,
          responseType: 'action_result',
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        updateMessage(messageId, { actionPreviewResolved: 'FAILED' })
        appendMessage({
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'The action could not be completed.',
          createdAt: new Date().toISOString(),
        })
      }
    },
    [appendMessage, sessionId, updateMessage],
  )

  const cancelActionPreview = useCallback(
    async (messageId: string, preview: ActionPreview) => {
      if (preview.executionId) {
        try {
          await cancelAction(preview.executionId)
        } catch {
          // The preview expires server-side regardless.
        }
      }
      updateMessage(messageId, { actionPreviewResolved: 'CANCELLED' })
      appendMessage({
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: 'Cancelled — nothing was changed.',
        createdAt: new Date().toISOString(),
      })
    },
    [appendMessage, updateMessage],
  )

  const undoExecutedAction = useCallback(
    async (result: ActionResult) => {
      try {
        const undone = await undoAction(result.executionId)
        appendMessage({
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: undone.message || 'Undone — the change was reverted.',
          actionResult: undone,
          responseType: 'action_result',
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        appendMessage({
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'The change could not be undone.',
          createdAt: new Date().toISOString(),
        })
      }
    },
    [appendMessage],
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
        setMessages((prev) => {
          // Drop optimistic local copies (user_*/ai_* ids) that the server
          // already persisted — otherwise pull-to-refresh duplicates them.
          const serverKeys = new Set(mapped.map((m) => `${m.role}:${m.content}`))
          const localOnly = prev.filter(
            (m) => !serverKeys.has(`${m.role}:${m.content}`)
          )
          return [...mapped, ...localOnly]
        })
      } catch (err) {
        console.warn('Failed to load copilot history:', err)
      }
    },
    [sessionId]
  )

  const loadSession = useCallback(
    async (targetSessionId: string) => {
      setError(null)
      setLastFailedText(null)
      setIsLoading(true)
      setSessionId(targetSessionId)
      try {
        const history = await getCopilotHistory(targetSessionId, 0, 100)
        const mapped: ChatMessageItemData[] = history.map((h: CopilotHistoryMessage) => ({
          id: h.id,
          role: h.role as 'user' | 'assistant',
          content: h.content,
          intent: h.intent || undefined,
          createdAt: h.createdAt || new Date().toISOString(),
        }))
        setMessages(mapped)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load chat.'
        console.warn('Failed to load copilot session:', err)
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const renameSession = useCallback(
    async (targetSessionId: string, title: string) => {
      try {
        await renameCopilotSession(targetSessionId, title)
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === targetSessionId ? { ...s, title } : s
          )
        )
        await loadSessions()
      } catch (err) {
        console.warn('Failed to rename copilot session:', err)
      }
    },
    [loadSessions]
  )

  const deleteSession = useCallback(
    async (targetSessionId: string) => {
      try {
        await deleteCopilotSession(targetSessionId)
        setSessions((prev) => prev.filter((s) => s.sessionId !== targetSessionId))
        await loadSessions()
      } catch (err) {
        console.warn('Failed to delete copilot session:', err)
      }
    },
    [loadSessions]
  )

  const setOnline = useCallback((online: boolean) => {
    setIsOnline(online)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setLastFailedText(null)
  }, [])

  const newChat = useCallback(() => {
    setMessages([])
    setError(null)
    setLastFailedText(null)
    setSessionId(`session_${Date.now()}`)
  }, [])

  return {
    messages,
    isLoading,
    isStreaming,
    thinkingStep,
    error,
    isOnline,
    sessionId,
    sessions,
    clearMessages,
    newChat,
    sendMessage,
    extractDocument,
    sendStream,
    runApiAction,
    confirmActionPreview,
    cancelActionPreview,
    undoExecutedAction,
    retry,
    loadHistory,
    loadSessions,
    loadSession,
    renameSession,
    deleteSession,
    setOnline,
  }
}
