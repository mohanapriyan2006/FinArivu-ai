import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { BudgetService, type BudgetAnalysis } from '@/services/BudgetService'
import { DashboardService, type DashboardSummary } from '@/services/DashboardService'
import { ExpenseService, type Expense } from '@/services/ExpenseService'
import { GoalService, type Goal } from '@/services/GoalService'
import { IncomeService, type Income } from '@/services/IncomeService'

import { buildInsightsState, normalizeGoals } from './insightsViewModel'
import type { InsightsViewModel, UseInsightsResult } from './types'

export function useInsights(): UseInsightsResult {
  const { getToken } = useAuthContext()
  const { profile } = useFinancialProfile()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [budget, setBudget] = useState<BudgetAnalysis | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income[]>([])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const [dash, budgetAnalysis, goalList, expenseList, incomeList] = await Promise.all([
        DashboardService.getSummary(token),
        BudgetService.getAnalysis(token),
        GoalService.list(token),
        ExpenseService.list(token),
        IncomeService.list(token),
      ])
      setDashboard(dash)
      setBudget(budgetAnalysis)
      setGoals(Array.isArray(goalList) ? goalList : [])
      setExpenses(Array.isArray(expenseList) ? expenseList : [])
      setIncome(Array.isArray(incomeList) ? incomeList : [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load your latest insights.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const insightGoals = useMemo(() => normalizeGoals(profile, goals), [profile, goals])

  const state = useMemo<InsightsViewModel>(() => {
    return buildInsightsState({
      profile,
      dashboard,
      budget,
      goals: insightGoals,
      expenses,
      income,
    })
  }, [profile, dashboard, budget, insightGoals, expenses, income])

  return { state, isLoading, error, refetch: fetchData }
}
