export const BaseColors = {
  primary: '#0D47A1',
  primaryDark: '#071C3F',
  accent: '#F4B400',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#DC2626',
  backgroundLight: '#F8FAFC',
  surfaceLight: '#FFFFFF',
  backgroundDark: '#0B1220',
  surfaceDark: '#111827',
  textPrimaryLight: '#0F172A',
  textSecondaryLight: '#475569',
  textPrimaryDark: '#F8FAFC',
  textSecondaryDark: '#CBD5E1',
} as const

export const ChartColors = {
  income: '#22C55E',
  expenses: '#DC2626',
  investments: '#0D47A1',
  goals: '#F4B400',
  netWorth: '#14B8A6',
} as const

export type BaseColorKey = keyof typeof BaseColors
export type ChartColorKey = keyof typeof ChartColors
