/**
 * Shared display helpers for action cards — field labels, values, and
 * status styling. Pure functions, directly unit-testable.
 */

import type { ActionExecutionStatus, ActionPreviewStatus } from '@/types/actions'

const FIELD_LABELS: Record<string, string> = {
  amount: 'Amount',
  monthlyLimit: 'Monthly limit',
  period: 'Period',
  categoryName: 'Category',
  description: 'Description',
  expenseDate: 'Date',
  incomeDate: 'Date',
  paymentMethod: 'Payment method',
  isRecurring: 'Recurring',
  isPrimary: 'Primary',
  frequency: 'Frequency',
  goalName: 'Goal',
  targetAmount: 'Target amount',
  currentAmount: 'Saved so far',
  targetDate: 'Target date',
  priority: 'Priority',
  source: 'Source',
  status: 'Status',
}

const MONEY_FIELDS = new Set([
  'amount',
  'monthlyLimit',
  'targetAmount',
  'currentAmount',
  'monthlyBudgetChange',
  'targetAmountChange',
  'currentAmountChange',
  'amountAdded',
  'amountChange',
  'remainingBudget',
  'budget',
  'spent',
  'savings',
  'totalIncome',
  'totalExpenses',
  'monthlyContribution',
])

const HIDDEN_FIELDS = new Set(['categoryId', 'entityId'])

export function fieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  // camelCase → Title Case fallback.
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

export function isHiddenField(key: string): boolean {
  return HIDDEN_FIELDS.has(key)
}

export function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    if (MONEY_FIELDS.has(key)) {
      return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    }
    return key === 'usagePercent' || key === 'savingsRate'
      ? `${value}%`
      : String(value)
  }
  if (typeof value === 'string') {
    // ISO date → readable form.
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value)
      return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
    }
    return value
  }
  return String(value)
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

export function statusTone(
  status: ActionExecutionStatus | ActionPreviewStatus | string,
): StatusTone {
  switch (status) {
    case 'EXECUTED':
      return 'success'
    case 'UNDONE':
      return 'info'
    case 'AWAITING_CONFIRMATION':
    case 'PREVIEWED':
      return 'warning'
    case 'EXECUTING':
      return 'info'
    case 'FAILED':
      return 'danger'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Human-readable impact lines from the deterministic impact dict. */
export function impactLines(impact: Record<string, unknown> | undefined): string[] {
  if (!impact) return []
  const lines: string[] = []
  for (const [key, value] of Object.entries(impact)) {
    if (key === 'before' || key === 'after' || value === null || value === undefined) {
      continue
    }
    if (typeof value === 'number') {
      const label = fieldLabel(key)
      const formatted = formatFieldValue(key, value)
      const isDelta = /change|added$/i.test(key)
      const signed =
        isDelta && value > 0 && MONEY_FIELDS.has(key) ? `+${formatted}` : formatted
      lines.push(`${label}: ${signed}`)
    }
  }
  return lines
}
