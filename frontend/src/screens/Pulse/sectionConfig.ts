import {
  Banknote,
  Calculator,
  CreditCard,
  Landmark,
  Plus,
  Receipt,
  Shield,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'

import type { ThemeColors } from '@/theme'

export type SectionColorKey = 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
export type SectionBackgroundKey =
  | 'primaryBackground'
  | 'successBackground'
  | 'accentBackground'
  | 'dangerBackground'
  | 'surface'

export interface SectionField {
  key: string
  label: string
  placeholder?: string
  keyboard?: 'default' | 'numeric'
  options?: string[]
}

export interface SectionSpec {
  /** Section id used in routes, e.g. 'expenses' */
  title: string
  icon: LucideIcon
  color: SectionColorKey
  background: SectionBackgroundKey
  fields: SectionField[]
  emptyTitle: string
  emptyMessage: string
}

const today = () => new Date().toISOString().split('T')[0]

export const SAVINGS_TYPES = new Set([
  'Bank',
  'Cash',
  'Savings Account',
  'Current Account',
  'Emergency Fund',
])
export const FIXED_TYPES = new Set(['Fixed Deposit', 'FD'])

/**
 * Single source of truth for every Pulse finance section.
 * The create form, section list and all "add" entry points read from here so
 * the same task always uses the same component — only the theme differs.
 */
export const SECTIONS: Record<string, SectionSpec> = {
  income: {
    title: 'Income',
    icon: Banknote,
    color: 'success',
    background: 'successBackground',
    emptyTitle: 'No income added yet',
    emptyMessage: 'Add your salary and other income sources.',
    fields: [
      { key: 'source', label: 'Source', placeholder: 'Salary' },
      { key: 'amount', label: 'Amount', placeholder: '50000', keyboard: 'numeric' },
      { key: 'incomeDate', label: 'Date', placeholder: today() },
      { key: 'notes', label: 'Notes (optional)', placeholder: 'Monthly salary' },
    ],
  },
  expenses: {
    title: 'Expense',
    icon: Receipt,
    color: 'danger',
    background: 'dangerBackground',
    emptyTitle: 'No expenses added yet',
    emptyMessage: 'Track your daily spending here.',
    fields: [
      { key: 'description', label: 'Description', placeholder: 'Grocery shopping' },
      { key: 'amount', label: 'Amount', placeholder: '1200', keyboard: 'numeric' },
      { key: 'expenseDate', label: 'Date', placeholder: today() },
      { key: 'categoryId', label: 'Category' },
    ],
  },
  savings: {
    title: 'Savings',
    icon: Wallet,
    color: 'success',
    background: 'successBackground',
    emptyTitle: 'No savings added yet',
    emptyMessage: 'Add your bank accounts and emergency funds.',
    fields: [
      { key: 'name', label: 'Account name', placeholder: 'Emergency Fund' },
      { key: 'assetType', label: 'Account type', placeholder: 'Bank / Cash' },
      { key: 'value', label: 'Current value', placeholder: '50000', keyboard: 'numeric' },
    ],
  },
  investments: {
    title: 'Investment',
    icon: TrendingUp,
    color: 'primary',
    background: 'primaryBackground',
    emptyTitle: 'No investments added yet',
    emptyMessage: 'Add mutual funds, stocks, PPF, gold and more.',
    fields: [
      { key: 'name', label: 'Investment name', placeholder: 'SBI Small Cap Fund' },
      { key: 'assetType', label: 'Investment type', placeholder: 'Mutual Fund / Stock' },
      { key: 'value', label: 'Current value', placeholder: '100000', keyboard: 'numeric' },
    ],
  },
  fixed_deposits: {
    title: 'Fixed Deposit',
    icon: Landmark,
    color: 'primary',
    background: 'primaryBackground',
    emptyTitle: 'No fixed deposits added yet',
    emptyMessage: 'Track your FDs and their maturity.',
    fields: [
      { key: 'name', label: 'FD name', placeholder: 'SBI Fixed Deposit' },
      { key: 'value', label: 'Value', placeholder: '100000', keyboard: 'numeric' },
      { key: 'interestRate', label: 'Interest rate (%)', placeholder: '7.5', keyboard: 'numeric' },
      { key: 'maturityDate', label: 'Maturity date', placeholder: '2030-12-31' },
    ],
  },
  loans: {
    title: 'Loan',
    icon: Banknote,
    color: 'danger',
    background: 'dangerBackground',
    emptyTitle: 'No loans added yet',
    emptyMessage: 'Track your outstanding loans and EMIs.',
    fields: [
      { key: 'name', label: 'Loan name', placeholder: 'Home Loan' },
      { key: 'liabilityType', label: 'Loan type', placeholder: 'Personal / Home' },
      { key: 'amount', label: 'Outstanding amount', placeholder: '500000', keyboard: 'numeric' },
      { key: 'emi', label: 'Monthly EMI', placeholder: '25000', keyboard: 'numeric' },
    ],
  },
  credit_cards: {
    title: 'Credit Card',
    icon: CreditCard,
    color: 'secondary',
    background: 'primaryBackground',
    emptyTitle: 'No credit cards added yet',
    emptyMessage: 'Track your cards, limits and spends.',
    fields: [
      { key: 'name', label: 'Card name / bank', placeholder: 'HDFC Regalia' },
      { key: 'amount', label: 'Outstanding amount', placeholder: '15000', keyboard: 'numeric' },
      { key: 'creditLimit', label: 'Credit limit', placeholder: '200000', keyboard: 'numeric' },
      { key: 'monthlySpend', label: 'Monthly spend (optional)', placeholder: '30000', keyboard: 'numeric' },
    ],
  },
  insurance: {
    title: 'Insurance Policy',
    icon: Shield,
    color: 'success',
    background: 'successBackground',
    emptyTitle: 'No insurance policies added yet',
    emptyMessage: 'Add your health and life insurance policies.',
    fields: [
      { key: 'type', label: 'Policy type', options: ['health', 'life'] },
      { key: 'coverage', label: 'Coverage amount', placeholder: '500000', keyboard: 'numeric' },
      { key: 'annualPremium', label: 'Annual premium', placeholder: '15000', keyboard: 'numeric' },
    ],
  },
  tax: {
    title: 'Tax Details',
    icon: Calculator,
    color: 'primary',
    background: 'primaryBackground',
    emptyTitle: 'No tax details added yet',
    emptyMessage: 'Add your tax regime and deductions.',
    fields: [
      { key: 'annualIncome', label: 'Annual income', placeholder: '1200000', keyboard: 'numeric' },
      { key: 'taxRegime', label: 'Tax regime', options: ['old', 'new', 'not-sure'] },
      { key: 'deduction_80c', label: '80C deduction', placeholder: '150000', keyboard: 'numeric' },
      { key: 'deduction_80d', label: '80D deduction', placeholder: '25000', keyboard: 'numeric' },
      { key: 'homeLoanInterest', label: 'Home loan interest', placeholder: '0', keyboard: 'numeric' },
      { key: 'nps', label: 'NPS deduction', placeholder: '0', keyboard: 'numeric' },
      { key: 'other', label: 'Other deductions', placeholder: '0', keyboard: 'numeric' },
    ],
  },
  goals: {
    title: 'Goal',
    icon: Target,
    color: 'warning',
    background: 'accentBackground',
    emptyTitle: 'No goals added yet',
    emptyMessage: 'Set a goal and get an AI savings plan.',
    fields: [
      { key: 'goalName', label: 'Goal name', placeholder: 'Dream Home' },
      { key: 'goalType', label: 'Goal type', placeholder: 'home / travel / education' },
      { key: 'targetAmount', label: 'Target amount', placeholder: '2000000', keyboard: 'numeric' },
      { key: 'currentAmount', label: 'Already saved (optional)', placeholder: '0', keyboard: 'numeric' },
      { key: 'targetDate', label: 'Target date', placeholder: today() },
    ],
  },
}

export function getSectionSpec(section: string): SectionSpec {
  return (
    SECTIONS[section] ?? {
      title: section,
      icon: Plus,
      color: 'primary',
      background: 'primaryBackground',
      fields: [{ key: 'name', label: 'Name' }],
      emptyTitle: `No ${section} added yet`,
      emptyMessage: 'Add your first record.',
    }
  )
}

export function resolveSectionColor(key: SectionColorKey, colors: ThemeColors): string {
  switch (key) {
    case 'primary':
      return colors.primary
    case 'secondary':
      return colors.secondary
    case 'success':
      return colors.success
    case 'warning':
      return colors.warning
    case 'danger':
      return colors.danger
    default:
      return colors.primary
  }
}

export function resolveSectionBackground(key: SectionBackgroundKey, colors: ThemeColors): string {
  switch (key) {
    case 'primaryBackground':
      return colors.primaryBackground
    case 'successBackground':
      return colors.successBackground
    case 'accentBackground':
      return colors.accentBackground
    case 'dangerBackground':
      return colors.dangerBackground
    case 'surface':
    default:
      return colors.surface
  }
}
