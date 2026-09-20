import { useCallback, useState } from 'react'

import {
  cancelAction,
  executeAction,
  previewAction,
  undoAction,
} from '@/services/ActionService'
import { getActionHistory } from '@/services/ActionService'
import type {
  ActionHistoryItem,
  ActionPreview,
  ActionPreviewRequest,
  ActionResult,
} from '@/types/actions'
import {
  reduceActionUiState,
  type ActionUiEvent,
  type ActionUiState,
} from './actionUiState'

export { reduceActionUiState }
export type { ActionUiEvent, ActionUiState }

export interface UseActionsReturn {
  state: ActionUiState
  prepare: (request: ActionPreviewRequest) => Promise<ActionPreview | null>
  confirm: () => Promise<ActionResult | null>
  cancel: () => Promise<void>
  undo: (executionId: string) => Promise<ActionResult | null>
  loadHistory: (limit?: number) => Promise<ActionHistoryItem[]>
  reset: () => void
}

export function useActions(sessionId?: string): UseActionsReturn {
  const [state, setState] = useState<ActionUiState>({ kind: 'idle' })
  const dispatch = (event: ActionUiEvent) =>
    setState((prev) => reduceActionUiState(prev, event))

  const prepare = useCallback(
    async (request: ActionPreviewRequest): Promise<ActionPreview | null> => {
      dispatch({ type: 'prepare_started' })
      try {
        const preview = await previewAction({ ...request, sessionId })
        if (preview.status === 'NEEDS_INPUT') {
          dispatch({
            type: 'needs_input',
            question:
              preview.clarificationQuestion ||
              'I need a bit more detail to make that change.',
            missingFields: preview.missingFields,
          })
          return preview
        }
        if (preview.status === 'NOT_SUPPORTED') {
          dispatch({
            type: 'failed',
            message:
              preview.clarificationQuestion ||
              "I can't perform that kind of change yet.",
          })
          return preview
        }
        dispatch({ type: 'preview_ready', preview })
        return preview
      } catch (err) {
        dispatch({
          type: 'failed',
          message:
            err instanceof Error ? err.message : 'Could not prepare the action.',
        })
        return null
      }
    },
    [sessionId],
  )

  const confirm = useCallback(async (): Promise<ActionResult | null> => {
    if (state.kind !== 'ready') return null
    const preview = state.preview
    dispatch({ type: 'confirm_started' })
    try {
      const result = await executeAction(
        preview.executionId as string,
        sessionId,
      )
      dispatch({ type: 'executed', result })
      return result
    } catch (err) {
      dispatch({
        type: 'failed',
        message:
          err instanceof Error ? err.message : 'The action could not be completed.',
      })
      return null
    }
  }, [state, sessionId])

  const cancel = useCallback(async () => {
    const preview =
      state.kind === 'ready' || state.kind === 'confirming'
        ? state.preview
        : null
    if (preview?.executionId) {
      try {
        await cancelAction(preview.executionId)
      } catch {
        // Best-effort — the preview expires server-side anyway.
      }
    }
    dispatch({ type: 'cancelled' })
  }, [state])

  const undo = useCallback(
    async (executionId: string): Promise<ActionResult | null> => {
      dispatch({ type: 'undo_started' })
      try {
        const result = await undoAction(executionId)
        dispatch({ type: 'undone', result })
        return result
      } catch (err) {
        dispatch({
          type: 'failed',
          message:
            err instanceof Error ? err.message : 'The change could not be undone.',
        })
        return null
      }
    },
    [],
  )

  const loadHistory = useCallback(
    (limit = 50) => getActionHistory(limit),
    [],
  )

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { state, prepare, confirm, cancel, undo, loadHistory, reset }
}
