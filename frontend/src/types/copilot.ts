/**
 * Canonical AI Copilot contract types.
 *
 * Mirrors `backend/app/ai/schemas/copilot.py` — field names are camelCase
 * on the wire (the backend serialises with `by_alias=True`).
 *
 * These types are the single source of truth for copilot payloads consumed
 * by `ChatService`, `useCopilot`, `CopilotScreen`, and chat components.
 */

/** Action types the backend may emit. API_ACTION is never executed. */
export type CopilotActionType = 'CHAT_FOLLOWUP' | 'NAVIGATE' | 'API_ACTION'

export interface CopilotArtifact {
  type: string
  title: string
  content: Record<string, unknown>
}

export interface CopilotRecommendation {
  title: string
  description: string
  category: string
}

export interface CopilotSuggestedAction {
  id: string
  label: string
  type: CopilotActionType
  payload?: Record<string, unknown>
  enabled?: boolean
  /**
   * Canonical navigation target key for NAVIGATE actions
   * (e.g. "budget", "goals"). Resolved to a screen via
   * `src/navigation/actionRoutes.ts`.
   */
  route?: string | null
}

export interface CopilotFollowUpQuestion {
  label: string
  type?: CopilotActionType
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
  data: Record<string, Record<string, unknown>>
  artifacts?: CopilotArtifact[]
  recommendations?: CopilotRecommendation[]
  followUpQuestions?: CopilotFollowUpQuestion[]
  suggestedActions?: CopilotSuggestedAction[]
  metadata?: CopilotMetadata
  disclaimer: string
  guardrailTriggered: boolean
  provider?: string
  model?: string
  tokensInput?: number
  tokensOutput?: number
}

export interface CopilotAttachmentInput {
  filename: string
  content: string
  mimeType?: string
}

// ── Chat list item model (UI layer) ──────────────────────────────────────

export type ChatArtifact = CopilotArtifact
export type ChatFollowUp = CopilotFollowUpQuestion
export type SuggestedAction = CopilotSuggestedAction

export interface ChatMessageAttachment {
  filename: string
  mimeType?: string
}

export interface ChatMessageItemData {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: ChatMessageAttachment[]
  summary?: string
  responseType?: string
  intent?: string
  agentsUsed?: string[]
  data?: Record<string, unknown>
  artifacts?: ChatArtifact[]
  recommendations?: CopilotRecommendation[]
  followUpQuestions?: ChatFollowUp[]
  suggestedActions?: SuggestedAction[]
  disclaimer?: string
  guardrailTriggered?: boolean
  createdAt?: string
}
