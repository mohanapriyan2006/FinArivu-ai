/**
 * Canonical contract for the Financial Action Plan (Phase 4).
 *
 * Mirrors `backend/app/action_plan/schemas.py` — the wire is camelCase.
 * Plan items are deterministic organisations of Money Radar signals; the
 * client never computes priority, impact or financial truth.
 */

import type {
  ActionIntent,
  DataFreshness,
  EvidenceItem,
  InsightImpact,
  ScenarioPreset,
} from './moneyRadar'

export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export type PlanItemStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SNOOZED'
  | 'DISMISSED'
  | 'EXPIRED'

export type PlanItemPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export type PlanItemCategory =
  | 'REVIEW_SPENDING'
  | 'REVIEW_BUDGET'
  | 'IMPROVE_CASHFLOW'
  | 'REPLAN_GOAL'
  | 'REVIEW_DEBT'
  | 'BUILD_RESERVE'
  | 'REVIEW_TAX'
  | 'REVIEW_RECURRING_COST'
  | 'REVIEW_NETWORTH'
  | 'COMPLETE_PROFILE'

export type PlanItemSource =
  | 'RADAR'
  | 'GOAL'
  | 'BUDGET'
  | 'CASHFLOW'
  | 'ACTION_HISTORY'
  | 'SYSTEM'

export type CompletionSource =
  | 'USER'
  | 'ACTION_EXECUTION'
  | 'SYSTEM_RECONCILIATION'

export type SnoozeOption = 'LATER_TODAY' | 'TOMORROW' | 'NEXT_WEEK'

/** Contextual operations a plan item may expose (server-declared). */
export type PlanItemAction =
  | 'DO_NOW'
  | 'SIMULATE'
  | 'PREVIEW_ACTION'
  | 'COMPLETE'
  | 'SNOOZE'
  | 'DISMISS'

export type DueWindow = 'TODAY' | 'THIS_WEEK' | 'NEXT_WEEK'

export interface FinancialPlanItem {
  id: string
  planId: string
  title: string
  summary: string
  category: PlanItemCategory
  priority: PlanItemPriority
  status: PlanItemStatus
  sourceType: PlanItemSource
  sourceInsightId?: string | null
  sourceInsightType?: string | null
  entityType?: string | null
  entityId?: string | null
  entityName: string
  evidence: EvidenceItem[]
  impact: InsightImpact
  why: string[]
  actions: PlanItemAction[]
  route?: string | null
  scenarioPreset?: ScenarioPreset | null
  actionPreset?: ActionIntent | null
  dueWindow?: DueWindow | string | null
  dataQuality: string
  freshness: DataFreshness
  score: number
  completionSource?: CompletionSource | null
  linkedActionExecutionId?: string | null
  linkedScenarioRunId?: string | null
  dismissedCount: number
  snoozedUntil?: string | null
  completedAt?: string | null
  dismissedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface FinancialActionPlan {
  id: string
  periodStart: string
  periodEnd: string
  status: PlanStatus
  generatedAt: string
  updatedAt: string
  generationVersion: number
  summary: string
  items: FinancialPlanItem[]
  completedCount: number
  activeCount: number
  deferredCount: number
  dismissedCount: number
  planVersion: string
}

export interface PlanHistoryEntry {
  id: string
  periodStart: string
  periodEnd: string
  status: PlanStatus
  generatedAt: string
  activeCount: number
  completedCount: number
  dismissedCount: number
}
