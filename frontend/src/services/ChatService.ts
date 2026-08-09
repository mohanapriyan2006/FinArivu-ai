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

export interface CopilotSession {
  sessionId: string
  title: string
  createdAt: string | null
  updatedAt: string | null
  messageCount: number
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
 * Retrieve the user's saved copilot chat sessions.
 */
export const getCopilotSessions = async (limit = 50): Promise<CopilotSession[]> => {
  const response = await api.get('/v1/copilot/sessions', {
    params: { limit },
  })
  const raw = (response.data?.data || []) as any[]
  return raw.map((s) => ({
    sessionId: s.session_id,
    title: s.title,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    messageCount: s.message_count,
  }))
}

/**
 * Check AI provider health status.
 */
export const checkCopilotHealth = async (): Promise<CopilotHealthResponse> => {
  const response = await api.get('/v1/copilot/health')
  return response.data?.data as CopilotHealthResponse
}

/**
 * Rename a saved copilot chat session.
 */
export const renameCopilotSession = async (
  sessionId: string,
  title: string
): Promise<void> => {
  await api.put(`/v1/copilot/sessions/${sessionId}`, { title })
}

/**
 * Delete a saved copilot chat session.
 */
export const deleteCopilotSession = async (sessionId: string): Promise<void> => {
  await api.delete(`/v1/copilot/sessions/${sessionId}`)
}

export interface CopilotDocumentUpload {
  uri: string
  name: string
  type: string
}

export interface CopilotDocumentUploadResponse {
  text: string
  filename: string
}

/**
 * Upload a document and receive extracted text from the backend.
 */
export const uploadCopilotDocument = async (
  file: CopilotDocumentUpload
): Promise<CopilotDocumentUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file as any)

  const response = await api.post('/v1/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data?.data as CopilotDocumentUploadResponse
}
