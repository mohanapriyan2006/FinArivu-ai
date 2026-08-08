import { api } from './api'
import SSE from 'react-native-sse'

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

export interface CopilotArtifact {
  type: string
  title: string
  content: CopilotAgentData
}

export interface CopilotRecommendation {
  title: string
  description: string
  category: string
}

export interface CopilotSuggestedAction {
  id: string
  label: string
  type: 'CHAT_FOLLOWUP' | 'NAVIGATE' | 'API_ACTION' | 'CREATE' | 'VIEW' | 'SIMULATE'
  payload?: Record<string, unknown>
  enabled?: boolean
  route?: string
}

export interface CopilotFollowUpQuestion {
  label: string
  type?: 'CHAT_FOLLOWUP' | 'NAVIGATE' | 'API_ACTION' | 'CREATE' | 'VIEW' | 'SIMULATE'
  payload?: Record<string, unknown>
}

export interface CopilotMetadata {
  responseType?: string
  intent: string
  agentsUsed: string[]
  provider?: string
  model?: string
  executionTimeMs: number
}

export interface CopilotChatResponse {
  messageId: string | null
  message: string
  responseType?: string
  summary?: string
  intent: string
  agentsUsed: string[]
  data: CopilotAgentData
  artifacts?: CopilotArtifact[]
  recommendations?: CopilotRecommendation[]
  followUpQuestions?: CopilotFollowUpQuestion[] | string[]
  suggestedActions?: CopilotSuggestedAction[]
  metadata?: CopilotMetadata
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
 * Returns an SSE instance from react-native-sse. Callers should attach
 * event listeners for 'message' and 'error' events and then `connect()`.
 */
export const streamCopilotMessage = (
  sessionId: string,
  message: string,
  contextHints: string[] = [],
  token: string
): SSE => {
  const url = `${api.defaults.baseURL}/v1/copilot/chat/stream`
  const body = JSON.stringify({
    session_id: sessionId,
    message,
    context_hints: contextHints,
  })

  const sse = new SSE(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  return sse
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
