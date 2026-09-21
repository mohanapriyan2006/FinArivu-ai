import { useCallback, useEffect, useRef, useState } from 'react'

import {
  dismissInsight,
  getRadarSummary,
  markInsightSeen,
  scanRadar,
} from '@/services/MoneyRadarService'
import type { RadarInsight, RadarSummary } from '@/types/moneyRadar'

export type RadarUiState =
  | { kind: 'loading' }
  | { kind: 'scanning' }
  | { kind: 'ready'; summary: RadarSummary }
  | { kind: 'error'; message: string }

export interface UseMoneyRadarResult {
  state: RadarUiState
  summary: RadarSummary | null
  insights: RadarInsight[]
  /** True while a scan or summary fetch is in flight. */
  isBusy: boolean
  /** Pull-to-refresh → GET /summary (cheap, uses last scan). */
  refresh: () => Promise<void>
  /** Manual rescan → POST /scan (full detector run). */
  rescan: () => Promise<void>
  markSeen: (id: string) => Promise<void>
  dismiss: (id: string) => Promise<void>
}

/**
 * Screen-level state for Money Radar. Fetches the persisted summary on
 * mount (auto-scans server-side on first use) and exposes lifecycle ops.
 */
export function useMoneyRadar(): UseMoneyRadarResult {
  const [state, setState] = useState<RadarUiState>({ kind: 'loading' })
  const [isBusy, setIsBusy] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsBusy(true)
    try {
      const summary = await getRadarSummary()
      if (mounted.current) {
        setState({ kind: 'ready', summary })
      }
    } catch (err) {
      if (mounted.current) {
        setState({
          kind: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Could not load Money Radar.',
        })
      }
    } finally {
      if (mounted.current) setIsBusy(false)
    }
  }, [])

  const rescan = useCallback(async () => {
    setState((s) => (s.kind === 'ready' ? s : { kind: 'scanning' }))
    setIsBusy(true)
    try {
      const summary = await scanRadar()
      if (mounted.current) {
        setState({ kind: 'ready', summary })
      }
    } catch (err) {
      if (mounted.current) {
        setState({
          kind: 'error',
          message:
            err instanceof Error ? err.message : 'Radar scan failed.',
        })
      }
    } finally {
      if (mounted.current) setIsBusy(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyUpdated = useCallback((updated: RadarInsight) => {
    setState((s) => {
      if (s.kind !== 'ready') return s
      const insights = s.summary.insights.map((i) =>
        i.id === updated.id ? updated : i,
      )
      const active = insights.filter(
        (i) => i.status === 'ACTIVE' || i.status === 'SEEN',
      )
      return {
        kind: 'ready',
        summary: {
          ...s.summary,
          insights,
          activeCount: active.length,
        },
      }
    })
  }, [])

  const markSeen = useCallback(
    async (id: string) => {
      const updated = await markInsightSeen(id)
      applyUpdated(updated)
    },
    [applyUpdated],
  )

  const dismiss = useCallback(
    async (id: string) => {
      const updated = await dismissInsight(id)
      applyUpdated(updated)
    },
    [applyUpdated],
  )

  return {
    state,
    summary: state.kind === 'ready' ? state.summary : null,
    insights: state.kind === 'ready' ? state.summary.insights : [],
    isBusy,
    refresh,
    rescan,
    markSeen,
    dismiss,
  }
}
