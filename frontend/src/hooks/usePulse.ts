import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { AssetService, type Asset } from '@/services/AssetService'
import { BudgetService, type BudgetAnalysis } from '@/services/BudgetService'
import { DashboardService, type DashboardSummary } from '@/services/DashboardService'
import { ExpenseService, type Expense } from '@/services/ExpenseService'
import { GoalService, type Goal } from '@/services/GoalService'
import { LiabilityService, type Liability } from '@/services/LiabilityService'
import type { OnboardingStepId } from '@/types/financialProfile'
import { buildPulseState } from '@/screens/Pulse/pulseViewModel'
import type { PulseState } from '@/screens/Pulse/types'

interface UsePulseResult {
  state: PulseState
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface PulseGoalSource {
  id: string
  name: string
  current: number
  target: number
  targetYear: number
}

function normalizeGoals(goals: Goal[]): PulseGoalSource[] {
  return goals.map((g) => {
    const targetDate = new Date(g.targetDate)
    const targetYear = isNaN(targetDate.getTime())
      ? new Date().getFullYear()
      : targetDate.getFullYear()
    return {
      id: g.id,
      name: g.goalName,
      current: g.currentAmount ?? 0,
      target: g.targetAmount,
      targetYear,
    }
  })
}

function normalizeProfileGoals(
  goals: { id: string; name: string; currentSavedAmount?: number; targetAmount: number; targetYear: number }[]
): PulseGoalSource[] {
  return goals.map((g) => ({
    id: g.id,
    name: g.name,
    current: g.currentSavedAmount ?? 0,
    target: g.targetAmount,
    targetYear: g.targetYear,
  }))
}

export function usePulse(): UsePulseResult {
  const { getToken } = useAuthContext()
  const { profile, completion } = useFinancialProfile()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [budget, setBudget] = useState<BudgetAnalysis | null>(null)
  const [serviceGoals, setServiceGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const [dash, budgetAnalysis, goalList, expenseList, assetList, liabilityList] = await Promise.all([
        DashboardService.getSummary(token),
        BudgetService.getAnalysis(token),
        GoalService.list(token),
        ExpenseService.list(token),
        AssetService.list(token),
        LiabilityService.list(token),
      ])
      setDashboard(dash)
      setBudget(budgetAnalysis)
      setServiceGoals(Array.isArray(goalList) ? goalList : [])
      setExpenses(Array.isArray(expenseList) ? expenseList : [])
      setAssets(Array.isArray(assetList) ? assetList : [])
      setLiabilities(Array.isArray(liabilityList) ? liabilityList : [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Some financial data could not be loaded.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const goals = useMemo<PulseGoalSource[]>(() => {
    if (serviceGoals.length > 0) {
      return normalizeGoals(serviceGoals)
    }
    if (profile.goals?.goals && profile.goals.goals.length > 0) {
      return normalizeProfileGoals(profile.goals.goals)
    }
    return []
  }, [serviceGoals, profile.goals])

  const state = useMemo<PulseState>(() => {
    return buildPulseState({
      profile,
      completionPercentage: completion.percentage,
      completionLastStep: (completion.lastIncompleteSection as OnboardingStepId | null) ?? null,
      dashboard,
      budget,
      goals,
      expenses,
      assets,
      liabilities,
    })
  }, [profile, completion, dashboard, budget, goals, expenses, assets, liabilities])

  return { state, isLoading, error, refetch: fetchData }
}
