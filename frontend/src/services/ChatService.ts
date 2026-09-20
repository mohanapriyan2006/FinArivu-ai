import { api } from './api'
import SSE from 'react-native-sse'
import type {
  CopilotAttachmentInput,
  CopilotChatResponse,
} from '@/types/copilot'

// Canonical copilot wire types live in src/types/copilot.ts — re-exported
// here so existing imports keep working.
export type {
  CopilotArtifact,
  CopilotChatResponse,
  CopilotFollowUpQuestion,
  CopilotMetadata,
  CopilotRecommendation,
  CopilotSuggestedAction,
} from '@/types/copilot'

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

export type CopilotAttachment = CopilotAttachmentInput

export interface CopilotChatRequest {
  sessionId: string
  message: string
  contextHints?: string[]
  attachments?: CopilotAttachment[]
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
  contextHints: string[] = [],
  attachments: CopilotAttachment[] = []
): Promise<CopilotChatResponse> => {
  const response = await api.post('/v1/copilot/chat', {
    session_id: sessionId,
    message,
    context_hints: contextHints,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      mime_type: a.mimeType || 'text/plain',
    })),
  })
  return response.data?.data as CopilotChatResponse
}

/**
 * Stream a response from the AI Copilot using Server-Sent Events.
 *
 * Returns an SSE instance from react-native-sse. Callers should attach
 * event listeners for 'message' and 'error' events and then `connect()`.
 */
export type CopilotStreamEvent =
  | 'token'
  | 'agent_start'
  | 'agent_done'
  | 'data'
  | 'done'

export const streamCopilotMessage = (
  sessionId: string,
  message: string,
  contextHints: string[] = [],
  token: string,
  attachments: CopilotAttachment[] = []
): SSE<CopilotStreamEvent> => {
  const url = `${api.defaults.baseURL}/v1/copilot/chat/stream`
  const body = JSON.stringify({
    session_id: sessionId,
    message,
    context_hints: contextHints,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      mime_type: a.mimeType || 'text/plain',
    })),
  })

  const sse = new SSE<CopilotStreamEvent>(url, {
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
  const raw = (response.data?.data || []) as Record<string, unknown>[]
  return raw.map((m) => ({
    id: String(m.id ?? ''),
    role: String(m.role ?? 'assistant'),
    content: String(m.content ?? ''),
    intent: (m.intent as string | null) ?? null,
    createdAt: (m.created_at as string | null) ?? null,
  }))
}

/**
 * Retrieve the user's saved copilot chat sessions.
 */
export const getCopilotSessions = async (limit = 50): Promise<CopilotSession[]> => {
  const response = await api.get('/v1/copilot/sessions', {
    params: { limit },
  })
  const raw = (response.data?.data || []) as Record<string, unknown>[]
  return raw.map((s) => ({
    sessionId: String(s.session_id ?? ''),
    title: String(s.title ?? 'New chat'),
    createdAt: (s.created_at as string | null) ?? null,
    updatedAt: (s.updated_at as string | null) ?? null,
    messageCount: Number(s.message_count ?? 0),
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
