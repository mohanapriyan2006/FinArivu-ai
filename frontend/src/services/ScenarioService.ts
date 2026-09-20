import { api } from './api'
import type {
  ScenarioCompareItem,
  ScenarioCompareResult,
  ScenarioHistoryItem,
  ScenarioResult,
  ScenarioRunRequest,
  ScenarioTypeInfo,
} from '@/types/scenarios'

/**
 * Scenario Lab endpoints — run / save / list / get / re-run / compare /
 * delete under /v1/scenarios.
 *
 * Safety contract: scenario runs are read-only simulations. The client
 * never sends baseline financial values — the server computes them from
 * the authenticated user's real records.
 */

const BASE = '/v1/scenarios'

export class ScenarioApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ScenarioApiError'
  }
}

function unwrapError(err: unknown): never {
  const e = err as {
    response?: {
      status?: number
      data?: { message?: string; errorCode?: string; error_code?: string }
    }
    message?: string
  }
  const message =
    e.response?.data?.message || e.message || 'The scenario could not be computed.'
  const code = e.response?.data?.errorCode || e.response?.data?.error_code
  throw new ScenarioApiError(message, code, e.response?.status)
}

export const getScenarioTypes = async (): Promise<ScenarioTypeInfo[]> => {
  try {
    const response = await api.get(`${BASE}/types`)
    return (response.data?.data as ScenarioTypeInfo[]) ?? []
  } catch (err) {
    unwrapError(err)
  }
}

export const runScenario = async (
  request: ScenarioRunRequest,
): Promise<ScenarioResult> => {
  try {
    const response = await api.post(`${BASE}/run`, {
      scenario_type: request.scenarioType,
      parameters: request.parameters,
      title: request.title,
      session_id: request.sessionId,
    })
    return response.data?.data as ScenarioResult
  } catch (err) {
    unwrapError(err)
  }
}

export const saveScenario = async (
  request: ScenarioRunRequest,
): Promise<ScenarioResult> => {
  try {
    const response = await api.post(`${BASE}/save`, {
      scenario_type: request.scenarioType,
      parameters: request.parameters,
      title: request.title,
      session_id: request.sessionId,
    })
    return response.data?.data as ScenarioResult
  } catch (err) {
    unwrapError(err)
  }
}

export const listScenarios = async (
  limit = 50,
  offset = 0,
): Promise<ScenarioHistoryItem[]> => {
  try {
    const response = await api.get(`${BASE}`, { params: { limit, offset } })
    return (response.data?.data as ScenarioHistoryItem[]) ?? []
  } catch (err) {
    unwrapError(err)
  }
}

export const getScenario = async (scenarioId: string): Promise<ScenarioResult> => {
  try {
    const response = await api.get(`${BASE}/${scenarioId}`)
    return response.data?.data as ScenarioResult
  } catch (err) {
    unwrapError(err)
  }
}

export const rerunScenario = async (
  scenarioId: string,
): Promise<ScenarioResult> => {
  try {
    const response = await api.post(`${BASE}/${scenarioId}/rerun`)
    return response.data?.data as ScenarioResult
  } catch (err) {
    unwrapError(err)
  }
}

export const compareScenarios = async (
  scenarios: ScenarioCompareItem[],
  scenarioIds: string[] = [],
): Promise<ScenarioCompareResult> => {
  try {
    const response = await api.post(`${BASE}/compare`, {
      scenarios: scenarios.map((s) => ({
        scenario_type: s.scenarioType,
        parameters: s.parameters,
        title: s.title,
      })),
      scenario_ids: scenarioIds,
    })
    return response.data?.data as ScenarioCompareResult
  } catch (err) {
    unwrapError(err)
  }
}

export const deleteScenario = async (scenarioId: string): Promise<void> => {
  try {
    await api.delete(`${BASE}/${scenarioId}`)
  } catch (err) {
    unwrapError(err)
  }
}
