import { api } from './api'
import type {
  ActionHistoryItem,
  ActionOperation,
  ActionPreview,
  ActionPreviewRequest,
  ActionResult,
} from '@/types/actions'

/**
 * Copilot action endpoints — preview / execute / cancel / undo / history.
 *
 * Safety contract: the client never sends a free-form mutation. It sends a
 * typed operation + arguments to `/preview`, receives a server-issued
 * `executionId`, and can only confirm that exact preview via `/execute`.
 */

const BASE = '/v1/copilot/actions'

export class ActionApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ActionApiError'
  }
}

function unwrapError(err: unknown): never {
  const e = err as {
    response?: { status?: number; data?: { message?: string; errorCode?: string; error_code?: string } }
    message?: string
  }
  const message =
    e.response?.data?.message || e.message || 'The action could not be completed.'
  const code = e.response?.data?.errorCode || e.response?.data?.error_code
  throw new ActionApiError(message, code, e.response?.status)
}

export const previewAction = async (
  request: ActionPreviewRequest,
): Promise<ActionPreview> => {
  try {
    const response = await api.post(`${BASE}/preview`, {
      operation: request.operation,
      arguments: request.arguments,
      session_id: request.sessionId,
    })
    return response.data?.data as ActionPreview
  } catch (err) {
    unwrapError(err)
  }
}

export const executeAction = async (
  executionId: string,
  sessionId?: string,
): Promise<ActionResult> => {
  try {
    const response = await api.post(`${BASE}/execute`, {
      execution_id: executionId,
      confirmation: true,
      session_id: sessionId,
    })
    return response.data?.data as ActionResult
  } catch (err) {
    unwrapError(err)
  }
}

export const cancelAction = async (executionId: string): Promise<ActionResult> => {
  try {
    const response = await api.post(`${BASE}/${executionId}/cancel`)
    return response.data?.data as ActionResult
  } catch (err) {
    unwrapError(err)
  }
}

export const undoAction = async (executionId: string): Promise<ActionResult> => {
  try {
    const response = await api.post(`${BASE}/${executionId}/undo`)
    return response.data?.data as ActionResult
  } catch (err) {
    unwrapError(err)
  }
}

export const getActionHistory = async (
  limit = 50,
  offset = 0,
): Promise<ActionHistoryItem[]> => {
  try {
    const response = await api.get(`${BASE}/history`, {
      params: { limit, offset },
    })
    return (response.data?.data as ActionHistoryItem[]) ?? []
  } catch (err) {
    unwrapError(err)
  }
}

/**
 * Build an ActionPreviewRequest from an API_ACTION suggested-action chip.
 * Returns null when the chip payload is not a valid executable operation.
 */
export function actionRequestFromPayload(
  payload: Record<string, unknown> | undefined,
  sessionId?: string,
): ActionPreviewRequest | null {
  const operation = payload?.operation
  const args = payload?.arguments
  if (typeof operation !== 'string' || typeof args !== 'object' || args === null) {
    return null
  }
  return {
    operation: operation as ActionOperation,
    arguments: args as Record<string, unknown>,
    sessionId,
  }
}
