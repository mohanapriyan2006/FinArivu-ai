import type {
  ScenarioCompareResult,
  ScenarioHistoryItem,
  ScenarioResult,
} from '@/types/scenarios'

/**
 * Pure UI state machine for the Scenario Lab.
 *
 * IDLE → RUNNING → RESULT / NEEDS_INPUT / INSUFFICIENT_DATA / ERROR
 * RESULT → SAVING → SAVED (recorded in history)
 * Any state → COMPARING → COMPARED (side-by-side view)
 */
export type ScenarioUiState =
  | { kind: 'idle' }
  | { kind: 'running'; label: string }
  | { kind: 'result'; result: ScenarioResult }
  | { kind: 'needs_input'; result: ScenarioResult }
  | { kind: 'insufficient_data'; result: ScenarioResult }
  | { kind: 'saving'; result: ScenarioResult }
  | { kind: 'saved'; result: ScenarioResult }
  | { kind: 'comparing' }
  | { kind: 'compared'; comparison: ScenarioCompareResult }
  | { kind: 'error'; message: string }

export type ScenarioUiEvent =
  | { type: 'run_started'; label: string }
  | { type: 'run_finished'; result: ScenarioResult }
  | { type: 'save_started' }
  | { type: 'saved'; result: ScenarioResult }
  | { type: 'compare_started' }
  | { type: 'compared'; comparison: ScenarioCompareResult }
  | { type: 'failed'; message: string }
  | { type: 'reset' }

/** Pure reducer — deterministic transitions, directly unit-testable. */
export function reduceScenarioUiState(
  state: ScenarioUiState,
  event: ScenarioUiEvent,
): ScenarioUiState {
  switch (event.type) {
    case 'run_started':
      return { kind: 'running', label: event.label }
    case 'run_finished': {
      if (state.kind !== 'running') return state
      if (event.result.status === 'NEEDS_INPUT') {
        return { kind: 'needs_input', result: event.result }
      }
      if (
        event.result.status === 'INSUFFICIENT_DATA' ||
        event.result.status === 'NOT_SUPPORTED'
      ) {
        return { kind: 'insufficient_data', result: event.result }
      }
      return { kind: 'result', result: event.result }
    }
    case 'save_started':
      return state.kind === 'result'
        ? { kind: 'saving', result: state.result }
        : state
    case 'saved':
      return { kind: 'saved', result: event.result }
    case 'compare_started':
      return { kind: 'comparing' }
    case 'compared':
      return state.kind === 'comparing'
        ? { kind: 'compared', comparison: event.comparison }
        : state
    case 'failed':
      return { kind: 'error', message: event.message }
    case 'reset':
      return { kind: 'idle' }
    default:
      return state
  }
}

/** Status → label for badges. */
export function scenarioStatusLabel(status: string): string {
  switch (status) {
    case 'COMPUTED':
      return 'Computed'
    case 'NEEDS_INPUT':
      return 'Needs input'
    case 'INSUFFICIENT_DATA':
      return 'Insufficient data'
    case 'NOT_SUPPORTED':
      return 'Not supported'
    default:
      return status
  }
}

/** Whether a history item can be re-run/compared. */
export function isRunnableHistoryItem(item: ScenarioHistoryItem): boolean {
  return item.status === 'COMPUTED'
}
