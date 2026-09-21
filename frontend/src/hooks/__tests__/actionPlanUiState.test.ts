import {
  SNOOZE_OPTIONS,
  categoryLabel,
  dueWindowLabel,
  groupPlanItems,
  priorityLabel,
  priorityRank,
  snoozeOptionLabel,
  sortPlanItems,
  statusLabel,
} from '@/hooks/actionPlanUiState'
import type { FinancialPlanItem } from '@/types/actionPlan'

function item(
  id: string,
  priority: FinancialPlanItem['priority'],
  status: FinancialPlanItem['status'],
  score = 0,
): FinancialPlanItem {
  return {
    id,
    planId: 'p1',
    title: id,
    summary: '',
    category: 'REVIEW_BUDGET',
    priority,
    status,
    sourceType: 'RADAR',
    entityName: '',
    evidence: [],
    impact: { metricLabel: '', description: '' },
    why: [],
    actions: [],
    dataQuality: 'AVAILABLE',
    freshness: { status: 'FRESH' },
    score,
    dismissedCount: 0,
  }
}

describe('actionPlanUiState', () => {
  it('sorts by priority then score', () => {
    const sorted = sortPlanItems([
      item('l', 'LOW', 'PENDING', 30),
      item('h', 'HIGH', 'PENDING', 50),
      item('m', 'MEDIUM', 'PENDING', 40),
      item('h2', 'HIGH', 'PENDING', 60),
    ])
    expect(sorted.map((i) => i.id)).toEqual(['h2', 'h', 'm', 'l'])
  })

  it('groups items into lifecycle sections', () => {
    const grouped = groupPlanItems([
      item('a', 'HIGH', 'PENDING'),
      item('b', 'MEDIUM', 'IN_PROGRESS'),
      item('c', 'LOW', 'COMPLETED'),
      item('d', 'LOW', 'SNOOZED'),
      item('e', 'LOW', 'DISMISSED'),
      item('f', 'LOW', 'EXPIRED'),
    ])
    expect(grouped.active.map((i) => i.id)).toEqual(['a', 'b'])
    expect(grouped.completed.map((i) => i.id)).toEqual(['c'])
    expect(grouped.snoozed.map((i) => i.id)).toEqual(['d'])
    expect(grouped.dismissed.map((i) => i.id).sort()).toEqual(['e', 'f'])
  })

  it('labels priorities and categories without color dependence', () => {
    expect(priorityRank('HIGH')).toBe(0)
    expect(priorityLabel('HIGH')).toBe('High priority')
    expect(priorityLabel('LOW')).toBe('Low priority')
    expect(categoryLabel('REVIEW_BUDGET')).toBe('Budget')
    expect(categoryLabel('BUILD_RESERVE')).toBe('Reserve')
    expect(categoryLabel('REPLAN_GOAL')).toBe('Goal')
  })

  it('labels due windows and statuses', () => {
    expect(dueWindowLabel('TODAY')).toBe('Today')
    expect(dueWindowLabel('THIS_WEEK')).toBe('This week')
    expect(dueWindowLabel(undefined)).toBe('')
    expect(statusLabel('SNOOZED')).toBe('Snoozed')
    expect(statusLabel('EXPIRED')).toBe('Resolved')
  })

  it('exposes the fixed snooze option set', () => {
    expect(SNOOZE_OPTIONS).toEqual(['LATER_TODAY', 'TOMORROW', 'NEXT_WEEK'])
    expect(snoozeOptionLabel('NEXT_WEEK')).toBe('Next week')
  })
})
