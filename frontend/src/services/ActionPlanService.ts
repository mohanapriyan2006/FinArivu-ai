import { api } from './api'
import type {
  FinancialActionPlan,
  FinancialPlanItem,
  PlanHistoryEntry,
  SnoozeOption,
} from '@/types/actionPlan'

/**
 * Financial Action Plan endpoints — current / generate / history / item
 * lifecycle. The client is a dumb renderer: priorities, evidence and
 * impact come from the deterministic backend; mutations on financial data
 * still go exclusively through the Phase 1 Action Copilot preview flow.
 */

const BASE = '/v1/action-plan'

export class ActionPlanApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ActionPlanApiError'
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
    e.response?.data?.message || e.message || 'Your plan could not be loaded.'
  const code = e.response?.data?.errorCode || e.response?.data?.error_code
  throw new ActionPlanApiError(message, code, e.response?.status)
}

/** Current-period plan — generated/reconciled server-side if absent. */
export const getCurrentPlan = async (
  refresh = false,
): Promise<FinancialActionPlan> => {
  try {
    const response = await api.get(`${BASE}/current`, {
      params: { refresh },
    })
    return response.data?.data as FinancialActionPlan
  } catch (err) {
    unwrapError(err)
  }
}

/** Force a reconcile against a fresh Money Radar scan. */
export const generatePlan = async (): Promise<FinancialActionPlan> => {
  try {
    const response = await api.post(`${BASE}/generate`)
    return response.data?.data as FinancialActionPlan
  } catch (err) {
    unwrapError(err)
  }
}

/** Past plan periods (read-only snapshots). */
export const getPlanHistory = async (
  skip = 0,
  limit = 12,
): Promise<PlanHistoryEntry[]> => {
  try {
    const response = await api.get(`${BASE}/history`, {
      params: { skip, limit },
    })
    return response.data?.data as PlanHistoryEntry[]
  } catch (err) {
    unwrapError(err)
  }
}

export const getPlanItem = async (
  itemId: string,
): Promise<FinancialPlanItem> => {
  try {
    const response = await api.get(`${BASE}/items/${itemId}`)
    return response.data?.data as FinancialPlanItem
  } catch (err) {
    unwrapError(err)
  }
}

/** PENDING → IN_PROGRESS. Accept never mutates financial data. */
export const acceptPlanItem = async (
  itemId: string,
): Promise<FinancialPlanItem> => {
  try {
    const response = await api.post(`${BASE}/items/${itemId}/accept`)
    return response.data?.data as FinancialPlanItem
  } catch (err) {
    unwrapError(err)
  }
}

export const snoozePlanItem = async (
  itemId: string,
  option: SnoozeOption,
): Promise<FinancialPlanItem> => {
  try {
    const response = await api.post(`${BASE}/items/${itemId}/snooze`, {
      option,
    })
    return response.data?.data as FinancialPlanItem
  } catch (err) {
    unwrapError(err)
  }
}

export const dismissPlanItem = async (
  itemId: string,
): Promise<FinancialPlanItem> => {
  try {
    const response = await api.post(`${BASE}/items/${itemId}/dismiss`)
    return response.data?.data as FinancialPlanItem
  } catch (err) {
    unwrapError(err)
  }
}

/** Complete an item; optionally link a Phase 1 execution for audit. */
export const completePlanItem = async (
  itemId: string,
  executionId?: string,
): Promise<FinancialPlanItem> => {
  try {
    const response = await api.post(`${BASE}/items/${itemId}/complete`, {
      executionId: executionId ?? null,
    })
    return response.data?.data as FinancialPlanItem
  } catch (err) {
    unwrapError(err)
  }
}

/** Radar → Plan bridge — returns the existing row if already in plan. */
export const addInsightToPlan = async (
  insightId: string,
): Promise<FinancialPlanItem> => {
  try {
    const response = await api.post(`${BASE}/items/from-insight`, {
      insightId,
    })
    return response.data?.data as FinancialPlanItem
  } catch (err) {
    unwrapError(err)
  }
}
