import { api } from './api'

// ── Legacy Chat (existing endpoint — preserved) ──────────────────────────

export interface ChatMessagePayload {
  session_id: string
  message: string
}

export interface ChatApiResponse {
  message: string
  guardrail_triggered: boolean
  disclaimer: string
}

export const sendChatMessage = async (
  sessionId: string,
  message: string
): Promise<ChatApiResponse> => {
  const response = await api.post('/v1/chat', {
    session_id: sessionId,
    message,
  })
  return response.data?.data as ChatApiResponse
}

// ── AI Copilot (new multi-agent endpoint) ────────────────────────────────

export interface CopilotChatRequest {
  sessionId: string
  message: string
  contextHints?: string[]
}

export interface CopilotAgentData {
  [agentName: string]: Record<string, unknown>
}

export interface CopilotChatResponse {
  messageId: string | null
  message: string
  intent: string
  agentsUsed: string[]
  data: CopilotAgentData
  disclaimer: string
  guardrailTriggered: boolean
  provider?: string
  model?: string
  tokensInput?: number
  tokensOutput?: number
}

export interface CopilotFeedbackRequest {
  messageId: string
  rating: number
  comment?: string
}

export interface CopilotHistoryMessage {
  id: string
  role: string
  content: string
  intent: string | null
  createdAt: string | null
}

export interface CopilotHealthResponse {
  provider: string
  model: string
  healthy: boolean
  latencyMs: number
}

/**
 * Send a message to the AI Copilot (synchronous full response).
 */
export const sendCopilotMessage = async (
  sessionId: string,
  message: string,
  contextHints: string[] = []
): Promise<CopilotChatResponse> => {
  const response = await api.post('/v1/copilot/chat', {
    session_id: sessionId,
    message,
    context_hints: contextHints,
  })
  return response.data?.data as CopilotChatResponse
}

/**
 * Stream a response from the AI Copilot using Server-Sent Events.
 *
 * Returns an EventSource instance. The caller should attach event
 * listeners for 'token', 'agent_start', 'agent_done', 'data',
 * 'error', and 'done' events.
 */
export const streamCopilotMessage = (
  sessionId: string,
  message: string,
  contextHints: string[] = [],
  token: string
): EventSource => {
  // SSE requires GET, but our endpoint is POST.
  // We use a fetch-based approach and parse the stream manually.
  // For React Native, use a polyfill like react-native-sse.
  const url = `${api.defaults.baseURL}/v1/copilot/chat/stream`

  // Note: This creates a basic EventSource-compatible object.
  // In production React Native, use react-native-sse or rn-fetch-blob.
  const eventSource = new EventSource(url, {
    // @ts-ignore — custom headers via polyfill
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      message,
      context_hints: contextHints,
    }),
  } as EventSourceInit)

  return eventSource
}

/**
 * Submit user feedback (rating + optional comment) for a copilot response.
 */
export const submitCopilotFeedback = async (
  messageId: string,
  rating: number,
  comment?: string
): Promise<void> => {
  await api.post('/v1/copilot/feedback', {
    message_id: messageId,
    rating,
    comment: comment || '',
  })
}

/**
 * Retrieve paginated copilot conversation history.
 */
export const getCopilotHistory = async (
  sessionId: string,
  skip = 0,
  limit = 50
): Promise<CopilotHistoryMessage[]> => {
  const response = await api.get('/v1/copilot/history', {
    params: { session_id: sessionId, skip, limit },
  })
  return response.data?.data as CopilotHistoryMessage[]
}

/**
 * Check AI provider health status.
 */
export const checkCopilotHealth = async (): Promise<CopilotHealthResponse> => {
  const response = await api.get('/v1/copilot/health')
  return response.data?.data as CopilotHealthResponse
}
