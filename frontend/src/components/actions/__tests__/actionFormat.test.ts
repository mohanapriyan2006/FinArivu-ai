import {
  fieldLabel,
  formatFieldValue,
  impactLines,
  isHiddenField,
  statusLabel,
  statusTone,
} from '../actionFormat'

describe('actionFormat', () => {
  it('maps known field keys to labels', () => {
    expect(fieldLabel('monthlyLimit')).toBe('Monthly limit')
    expect(fieldLabel('targetAmount')).toBe('Target amount')
    expect(fieldLabel('unknownField')).toBe('Unknown Field')
  })

  it('formats money fields with INR', () => {
    expect(formatFieldValue('monthlyLimit', 8000)).toBe('₹8,000')
    expect(formatFieldValue('amount', 1250.5)).toBe('₹1,250.5')
  })

  it('formats booleans and dates', () => {
    expect(formatFieldValue('isRecurring', true)).toBe('Yes')
    expect(formatFieldValue('expenseDate', '2026-09-21')).toContain('Sep')
    expect(formatFieldValue('amount', null)).toBe('—')
  })

  it('hides internal ids', () => {
    expect(isHiddenField('categoryId')).toBe(true)
    expect(isHiddenField('amount')).toBe(false)
  })

  it('maps statuses to tones', () => {
    expect(statusTone('EXECUTED')).toBe('success')
    expect(statusTone('AWAITING_CONFIRMATION')).toBe('warning')
    expect(statusTone('FAILED')).toBe('danger')
    expect(statusTone('UNDONE')).toBe('info')
    expect(statusTone('CANCELLED')).toBe('neutral')
  })

  it('humanizes status labels', () => {
    expect(statusLabel('AWAITING_CONFIRMATION')).toBe('Awaiting Confirmation')
    expect(statusLabel('EXECUTED')).toBe('Executed')
  })

  it('builds impact lines skipping nested blocks', () => {
    const lines = impactLines({
      monthlyBudgetChange: -4000,
      remainingBudget: 8000,
      before: { x: 1 },
      after: { x: 2 },
    })
    expect(lines).toContain('Monthly Budget Change: ₹-4,000')
    expect(lines).toContain('Remaining Budget: ₹8,000')
    expect(lines).toHaveLength(2)
  })
})
