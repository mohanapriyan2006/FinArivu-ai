import { api } from './api'
import type {
  InsightListFilters,
  RadarInsight,
  RadarInsightListResponse,
  RadarSummary,
} from '@/types/moneyRadar'

/**
 * Money Radar endpoints — scan / summary / insights / lifecycle.
 *
 * The client is a dumb renderer: it never computes financial truth, only
 * fetches the deterministic detector output and forwards typed bridge
 * payloads to Scenario Lab / Action Copilot.
 */

const BASE = '/v1/money-radar'

export class MoneyRadarApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'MoneyRadarApiError'
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
    e.response?.data?.message || e.message || 'The radar could not be loaded.'
  const code = e.response?.data?.errorCode || e.response?.data?.error_code
  throw new MoneyRadarApiError(message, code, e.response?.status)
}

function csv(values?: string[]): string | undefined {
  return values && values.length ? values.join(',') : undefined
}

/** Run a full detector scan — returns the reconciled summary. */
export const scanRadar = async (): Promise<RadarSummary> => {
  try {
    const response = await api.post(`${BASE}/scan`)
    return response.data?.data as RadarSummary
  } catch (err) {
    unwrapError(err)
  }
}

/** Last scan's summary; the backend auto-scans on first use. */
export const getRadarSummary = async (): Promise<RadarSummary> => {
  try {
    const response = await api.get(`${BASE}/summary`)
    return response.data?.data as RadarSummary
  } catch (err) {
    unwrapError(err)
  }
}

/** Filtered, paginated insight history. */
export const listInsights = async (
  filters: InsightListFilters = {},
): Promise<RadarInsightListResponse> => {
  try {
    const response = await api.get(`${BASE}/insights`, {
      params: {
        status: csv(filters.status),
        severity: csv(filters.severity),
        insight_type: csv(filters.insightType),
        category: csv(filters.category),
        entity_type: filters.entityType,
        created_after: filters.createdAfter,
        created_before: filters.createdBefore,
        skip: filters.skip ?? 0,
        limit: filters.limit ?? 50,
      },
    })
    return response.data?.data as RadarInsightListResponse
  } catch (err) {
    unwrapError(err)
  }
}

/** Full insight detail — evidence, source, freshness, actions. */
export const getInsight = async (id: string): Promise<RadarInsight> => {
  try {
    const response = await api.get(`${BASE}/insights/${id}`)
    return response.data?.data as RadarInsight
  } catch (err) {
    unwrapError(err)
  }
}

/** ACTIVE → SEEN (idempotent). */
export const markInsightSeen = async (id: string): Promise<RadarInsight> => {
  try {
    const response = await api.post(`${BASE}/insights/${id}/seen`)
    return response.data?.data as RadarInsight
  } catch (err) {
    unwrapError(err)
  }
}

/** ACTIVE/SEEN → DISMISSED (idempotent). */
export const dismissInsight = async (id: string): Promise<RadarInsight> => {
  try {
    const response = await api.post(`${BASE}/insights/${id}/dismiss`)
    return response.data?.data as RadarInsight
  } catch (err) {
    unwrapError(err)
  }
}
