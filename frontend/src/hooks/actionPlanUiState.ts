/**
 * Pure UI-state helpers for the Financial Action Plan surface.
 *
 * Grouping, ordering and label mapping live here — components stay
 * presentation-only and this module is unit-testable without React.
 */

import type {
  FinancialPlanItem,
  PlanItemCategory,
  PlanItemPriority,
  PlanItemStatus,
  SnoozeOption,
} from '@/types/actionPlan'

export type PlanSection =
  | 'active'
  | 'completed'
  | 'snoozed'
  | 'dismissed'

const PRIORITY_RANK: Record<PlanItemPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

export function priorityRank(priority: PlanItemPriority): number {
  return PRIORITY_RANK[priority] ?? 3
}

/** Active items first by priority, then score (stable, deterministic). */
export function sortPlanItems(items: FinancialPlanItem[]): FinancialPlanItem[] {
  return [...items].sort((a, b) => {
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority)
    if (byPriority !== 0) return byPriority
    return b.score - a.score
  })
}

export interface GroupedPlanItems {
  active: FinancialPlanItem[]
  completed: FinancialPlanItem[]
  snoozed: FinancialPlanItem[]
  dismissed: FinancialPlanItem[]
}

export function groupPlanItems(
  items: FinancialPlanItem[],
): GroupedPlanItems {
  const grouped: GroupedPlanItems = {
    active: [],
    completed: [],
    snoozed: [],
    dismissed: [],
  }
  for (const item of sortPlanItems(items)) {
    switch (item.status) {
      case 'PENDING':
      case 'IN_PROGRESS':
        grouped.active.push(item)
        break
      case 'COMPLETED':
        grouped.completed.push(item)
        break
      case 'SNOOZED':
        grouped.snoozed.push(item)
        break
      default:
        grouped.dismissed.push(item)
    }
  }
  return grouped
}

/** Short label for category chips — not color-only. */
export function categoryLabel(category: PlanItemCategory): string {
  switch (category) {
    case 'REVIEW_SPENDING':
      return 'Spending'
    case 'REVIEW_BUDGET':
      return 'Budget'
    case 'IMPROVE_CASHFLOW':
      return 'Cash flow'
    case 'REPLAN_GOAL':
      return 'Goal'
    case 'REVIEW_DEBT':
      return 'Debt'
    case 'BUILD_RESERVE':
      return 'Reserve'
    case 'REVIEW_TAX':
      return 'Tax'
    case 'REVIEW_RECURRING_COST':
      return 'Recurring'
    case 'REVIEW_NETWORTH':
      return 'Net worth'
    case 'COMPLETE_PROFILE':
      return 'Profile'
    default:
      return 'Plan'
  }
}

export function priorityLabel(priority: PlanItemPriority): string {
  switch (priority) {
    case 'HIGH':
      return 'High priority'
    case 'MEDIUM':
      return 'Medium priority'
    default:
      return 'Low priority'
  }
}

export function dueWindowLabel(dueWindow?: string | null): string {
  switch (dueWindow) {
    case 'TODAY':
      return 'Today'
    case 'THIS_WEEK':
      return 'This week'
    case 'NEXT_WEEK':
      return 'Next week'
    default:
      return ''
  }
}

/** Human label for snooze options (§96 fixed set). */
export function snoozeOptionLabel(option: SnoozeOption): string {
  switch (option) {
    case 'LATER_TODAY':
      return 'Later today'
    case 'TOMORROW':
      return 'Tomorrow'
    case 'NEXT_WEEK':
      return 'Next week'
    default:
      return 'Later'
  }
}

export const SNOOZE_OPTIONS: SnoozeOption[] = [
  'LATER_TODAY',
  'TOMORROW',
  'NEXT_WEEK',
]

export function statusLabel(status: PlanItemStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In progress'
    case 'COMPLETED':
      return 'Completed'
    case 'SNOOZED':
      return 'Snoozed'
    case 'DISMISSED':
      return 'Dismissed'
    case 'EXPIRED':
      return 'Resolved'
    default:
      return 'Pending'
  }
}
