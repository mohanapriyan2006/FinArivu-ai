import { useTrackerList } from './useTrackerList'
import { ExpenseService, type Expense, type ExpenseInput } from '@/services/ExpenseService'

export function useExpenses() {
  return useTrackerList<Expense, ExpenseInput>(ExpenseService)
}
