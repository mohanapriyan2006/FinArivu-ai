import { useTrackerList } from './useTrackerList'
import { BudgetService, type Budget, type BudgetInput } from '@/services/BudgetService'

export function useBudgets() {
  return useTrackerList<Budget, BudgetInput>(BudgetService)
}
