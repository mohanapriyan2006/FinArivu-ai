import { useCallback, useState } from 'react'

import {
  compareScenarios,
  deleteScenario,
  getScenario,
  getScenarioTypes,
  listScenarios,
  rerunScenario,
  runScenario,
  saveScenario,
} from '@/services/ScenarioService'
import type {
  ScenarioCompareItem,
  ScenarioHistoryItem,
  ScenarioResult,
  ScenarioRunRequest,
  ScenarioTypeInfo,
} from '@/types/scenarios'
import {
  reduceScenarioUiState,
  type ScenarioUiEvent,
  type ScenarioUiState,
} from './scenarioUiState'

export { reduceScenarioUiState }
export type { ScenarioUiEvent, ScenarioUiState }

export interface UseScenariosReturn {
  state: ScenarioUiState
  run: (request: ScenarioRunRequest) => Promise<ScenarioResult | null>
  save: (request: ScenarioRunRequest) => Promise<ScenarioResult | null>
  rerun: (scenarioId: string) => Promise<ScenarioResult | null>
  compare: (
    scenarios: ScenarioCompareItem[],
    scenarioIds?: string[],
  ) => Promise<void>
  remove: (scenarioId: string) => Promise<void>
  loadHistory: (limit?: number) => Promise<ScenarioHistoryItem[]>
  loadTypes: () => Promise<ScenarioTypeInfo[]>
  loadSaved: (scenarioId: string) => Promise<ScenarioResult | null>
  reset: () => void
}

export function useScenarios(sessionId?: string): UseScenariosReturn {
  const [state, setState] = useState<ScenarioUiState>({ kind: 'idle' })
  const dispatch = (event: ScenarioUiEvent) =>
    setState((prev) => reduceScenarioUiState(prev, event))

  const run = useCallback(
    async (request: ScenarioRunRequest): Promise<ScenarioResult | null> => {
      dispatch({ type: 'run_started', label: String(request.scenarioType) })
      try {
        const result = await runScenario({ ...request, sessionId })
        dispatch({ type: 'run_finished', result })
        return result
      } catch (err) {
        dispatch({
          type: 'failed',
          message:
            err instanceof Error
              ? err.message
              : 'The scenario could not be computed.',
        })
        return null
      }
    },
    [sessionId],
  )

  const save = useCallback(
    async (request: ScenarioRunRequest): Promise<ScenarioResult | null> => {
      dispatch({ type: 'save_started' })
      try {
        const result = await saveScenario({ ...request, sessionId })
        dispatch({ type: 'saved', result })
        return result
      } catch (err) {
        dispatch({
          type: 'failed',
          message:
            err instanceof Error ? err.message : 'The scenario could not be saved.',
        })
        return null
      }
    },
    [sessionId],
  )

  const rerun = useCallback(
    async (scenarioId: string): Promise<ScenarioResult | null> => {
      dispatch({ type: 'run_started', label: 'rerun' })
      try {
        const result = await rerunScenario(scenarioId)
        dispatch({ type: 'run_finished', result })
        return result
      } catch (err) {
        dispatch({
          type: 'failed',
          message:
            err instanceof Error ? err.message : 'The scenario could not be re-run.',
        })
        return null
      }
    },
    [],
  )

  const compare = useCallback(
    async (scenarios: ScenarioCompareItem[], scenarioIds: string[] = []) => {
      dispatch({ type: 'compare_started' })
      try {
        const comparison = await compareScenarios(scenarios, scenarioIds)
        dispatch({ type: 'compared', comparison })
      } catch (err) {
        dispatch({
          type: 'failed',
          message:
            err instanceof Error
              ? err.message
              : 'The scenarios could not be compared.',
        })
      }
    },
    [],
  )

  const remove = useCallback(async (scenarioId: string) => {
    await deleteScenario(scenarioId)
  }, [])

  const loadHistory = useCallback(
    (limit = 50) => listScenarios(limit),
    [],
  )

  const loadTypes = useCallback(() => getScenarioTypes(), [])

  const loadSaved = useCallback(
    async (scenarioId: string): Promise<ScenarioResult | null> => {
      dispatch({ type: 'run_started', label: 'saved' })
      try {
        const result = await getScenario(scenarioId)
        dispatch({ type: 'run_finished', result })
        return result
      } catch (err) {
        dispatch({
          type: 'failed',
          message:
            err instanceof Error
              ? err.message
              : 'The scenario could not be loaded.',
        })
        return null
      }
    },
    [],
  )

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return {
    state,
    run,
    save,
    rerun,
    compare,
    remove,
    loadHistory,
    loadTypes,
    loadSaved,
    reset,
  }
}
