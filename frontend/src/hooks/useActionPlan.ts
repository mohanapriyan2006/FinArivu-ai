import { useCallback, useEffect, useRef, useState } from 'react'

import {
  acceptPlanItem,
  completePlanItem,
  dismissPlanItem,
  generatePlan,
  getCurrentPlan,
  snoozePlanItem,
} from '@/services/ActionPlanService'
import type {
  FinancialActionPlan,
  FinancialPlanItem,
  SnoozeOption,
} from '@/types/actionPlan'

export type PlanUiState =
  | { kind: 'loading' }
  | { kind: 'generating' }
  | { kind: 'ready'; plan: FinancialActionPlan }
  | { kind: 'error'; message: string }

export interface UseActionPlanResult {
  state: PlanUiState
  plan: FinancialActionPlan | null
  items: FinancialPlanItem[]
  isBusy: boolean
  /** Cheap load — uses the persisted plan + last radar scan. */
  refresh: () => Promise<void>
  /** Full reconcile — rescan Money Radar then rebuild the plan. */
  regenerate: () => Promise<void>
  accept: (id: string) => Promise<FinancialPlanItem | null>
  snooze: (id: string, option: SnoozeOption) => Promise<FinancialPlanItem | null>
  dismiss: (id: string) => Promise<FinancialPlanItem | null>
  complete: (
    id: string,
    executionId?: string,
  ) => Promise<FinancialPlanItem | null>
}

/**
 * Screen-level state for the Financial Action Plan. The hook never
 * computes priorities or financial truth — it renders what the
 * deterministic backend returns and forwards lifecycle intents.
 */
export function useActionPlan(): UseActionPlanResult {
  const [state, setState] = useState<PlanUiState>({ kind: 'loading' })
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
      const plan = await getCurrentPlan()
      if (mounted.current) setState({ kind: 'ready', plan })
    } catch (err) {
      if (mounted.current) {
        setState({
          kind: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Your plan could not be loaded.',
        })
      }
    } finally {
      if (mounted.current) setIsBusy(false)
    }
  }, [])

  const regenerate = useCallback(async () => {
    setState((s) => (s.kind === 'ready' ? s : { kind: 'generating' }))
    setIsBusy(true)
    try {
      const plan = await generatePlan()
      if (mounted.current) setState({ kind: 'ready', plan })
    } catch (err) {
      if (mounted.current) {
        setState({
          kind: 'error',
          message:
            err instanceof Error ? err.message : 'Plan refresh failed.',
        })
      }
    } finally {
      if (mounted.current) setIsBusy(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyUpdated = useCallback((updated: FinancialPlanItem) => {
    setState((s) => {
      if (s.kind !== 'ready') return s
      const items = s.plan.items.map((i) => (i.id === updated.id ? updated : i))
      const counts = { ...s.plan }
      counts.items = items
      counts.activeCount = items.filter(
        (i) => i.status === 'PENDING' || i.status === 'IN_PROGRESS',
      ).length
      counts.completedCount = items.filter(
        (i) => i.status === 'COMPLETED',
      ).length
      counts.deferredCount = items.filter(
        (i) => i.status === 'SNOOZED',
      ).length
      counts.dismissedCount = items.filter(
        (i) => i.status === 'DISMISSED',
      ).length
      return { kind: 'ready', plan: counts }
    })
  }, [])

  const guard = useCallback(
    async (
      fn: () => Promise<FinancialPlanItem>,
    ): Promise<FinancialPlanItem | null> => {
      try {
        const updated = await fn()
        applyUpdated(updated)
        return updated
      } catch {
        return null
      }
    },
    [applyUpdated],
  )

  const accept = useCallback(
    (id: string) => guard(() => acceptPlanItem(id)),
    [guard],
  )
  const snooze = useCallback(
    (id: string, option: SnoozeOption) =>
      guard(() => snoozePlanItem(id, option)),
    [guard],
  )
  const dismiss = useCallback(
    (id: string) => guard(() => dismissPlanItem(id)),
    [guard],
  )
  const complete = useCallback(
    (id: string, executionId?: string) =>
      guard(() => completePlanItem(id, executionId)),
    [guard],
  )

  return {
    state,
    plan: state.kind === 'ready' ? state.plan : null,
    items: state.kind === 'ready' ? state.plan.items : [],
    isBusy,
    refresh,
    regenerate,
    accept,
    snooze,
    dismiss,
    complete,
  }
}
