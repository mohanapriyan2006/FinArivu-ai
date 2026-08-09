import { api } from './api'

export interface DashboardCard {
  id: string
  title: string
  label: 'Assets' | 'Liabilities'
  value: number
  count: number
  hasData: boolean
  route?: string
}

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  netWorth?: number
  totalAssets?: number
  totalLiabilities?: number
  recentIncome: Array<{
    id: string
    source: string
    amount: number
    incomeDate: string
  }>
  recentExpenses: Array<{
    id: string
    description: string | null
    amount: number
    expenseDate: string
  }>
  expenseBreakdown: Array<{
    category: string
    amount: number
  }>
  cards?: DashboardCard[]
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

export const DashboardService = {
  async getSummary(token: string | null): Promise<DashboardSummary | null> {
    const response = await api.get('/v1/financial/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = response.data?.data
    if (!data) return null
    return {
      totalIncome: toNumber(data.totalIncome),
      totalExpenses: toNumber(data.totalExpenses),
      netCashFlow: toNumber(data.netCashFlow),
      netWorth: toNumber(data.netWorth),
      totalAssets: toNumber(data.totalAssets),
      totalLiabilities: toNumber(data.totalLiabilities),
      recentIncome: data.recentIncome || [],
      recentExpenses: data.recentExpenses || [],
      expenseBreakdown: data.expenseBreakdown || [],
      cards: (data.cards || []).map((card: any) => ({
        id: card.id,
        title: card.title,
        label: card.label,
        value: toNumber(card.value),
        count: card.count ?? 0,
        hasData: Boolean(card.hasData),
        route: card.route,
      })),
    }
  },
}
