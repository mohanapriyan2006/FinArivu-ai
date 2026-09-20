import type { ActionPreview, ActionResult } from '@/types/actions'

/**
 * Pure UI state machine for the confirm-before-execute action flow.
 *
 * IDLE → PREPARING → READY → CONFIRMING → EXECUTED / ERROR
 *                          ↘ NEEDS_INPUT (clarification, no executionId)
 *                          ↘ CANCELLED (user dismissed the preview)
 *       EXECUTED → UNDOING → UNDONE / ERROR
 */
export type ActionUiState =
  | { kind: 'idle' }
  | { kind: 'preparing' }
  | { kind: 'ready'; preview: ActionPreview }
  | { kind: 'needs_input'; question: string; missingFields: string[] }
  | { kind: 'confirming'; preview: ActionPreview }
  | { kind: 'executed'; result: ActionResult }
  | { kind: 'undoing'; executionId: string }
  | { kind: 'undone'; result: ActionResult }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }

export type ActionUiEvent =
  | { type: 'prepare_started' }
  | { type: 'preview_ready'; preview: ActionPreview }
  | { type: 'needs_input'; question: string; missingFields: string[] }
  | { type: 'confirm_started' }
  | { type: 'executed'; result: ActionResult }
  | { type: 'undo_started' }
  | { type: 'undone'; result: ActionResult }
  | { type: 'cancelled' }
  | { type: 'failed'; message: string }
  | { type: 'reset' }

/** Pure reducer — deterministic transitions, directly unit-testable. */
export function reduceActionUiState(
  state: ActionUiState,
  event: ActionUiEvent,
): ActionUiState {
  switch (event.type) {
    case 'prepare_started':
      return { kind: 'preparing' }
    case 'preview_ready':
      return state.kind === 'preparing'
        ? { kind: 'ready', preview: event.preview }
        : state
    case 'needs_input':
      return state.kind === 'preparing'
        ? {
            kind: 'needs_input',
            question: event.question,
            missingFields: event.missingFields,
          }
        : state
    case 'confirm_started':
      return state.kind === 'ready'
        ? { kind: 'confirming', preview: state.preview }
        : state
    case 'executed':
      return { kind: 'executed', result: event.result }
    case 'undo_started':
      return state.kind === 'executed'
        ? { kind: 'undoing', executionId: state.result.executionId }
        : state
    case 'undone':
      return { kind: 'undone', result: event.result }
    case 'cancelled':
      return { kind: 'cancelled' }
    case 'failed':
      return { kind: 'error', message: event.message }
    case 'reset':
      return { kind: 'idle' }
    default:
      return state
  }
}
