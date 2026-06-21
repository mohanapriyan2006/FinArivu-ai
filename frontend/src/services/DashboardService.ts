import { api } from './api'

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
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
}

export const DashboardService = {
  async getSummary(token: string | null): Promise<DashboardSummary | null> {
    const response = await api.get('/v1/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data?.data || null
  },
}
