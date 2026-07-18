import { api } from './api'

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
