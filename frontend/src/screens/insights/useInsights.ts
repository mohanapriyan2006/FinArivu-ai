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
      const [dashResult, budgetResult, goalResult, expenseResult, incomeResult] =
        await Promise.allSettled([
          DashboardService.getSummary(token),
          BudgetService.getAnalysis(token),
          GoalService.list(token),
          ExpenseService.list(token),
          IncomeService.list(token),
        ])

      let hasError = false

      if (dashResult.status === 'fulfilled') {
        setDashboard(dashResult.value)
      } else {
        hasError = true
        console.warn('[useInsights] dashboard failed:', dashResult.reason)
      }

      if (budgetResult.status === 'fulfilled') {
        setBudget(budgetResult.value)
      } else {
        hasError = true
        console.warn('[useInsights] budget analysis failed:', budgetResult.reason)
      }

      if (goalResult.status === 'fulfilled') {
        setGoals(Array.isArray(goalResult.value) ? goalResult.value : [])
      } else {
        hasError = true
        console.warn('[useInsights] goals failed:', goalResult.reason)
      }

      if (expenseResult.status === 'fulfilled') {
        setExpenses(Array.isArray(expenseResult.value) ? expenseResult.value : [])
      } else {
        hasError = true
        console.warn('[useInsights] expenses failed:', expenseResult.reason)
      }

      if (incomeResult.status === 'fulfilled') {
        setIncome(Array.isArray(incomeResult.value) ? incomeResult.value : [])
      } else {
        hasError = true
        console.warn('[useInsights] income failed:', incomeResult.reason)
      }

      if (hasError) {
        setError('Some financial data could not be loaded.')
      }
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
