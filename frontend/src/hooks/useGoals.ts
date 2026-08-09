import { useTrackerList } from './useTrackerList'
import { GoalService, type Goal, type GoalInput } from '@/services/GoalService'

export function useGoals() {
  return useTrackerList<Goal, GoalInput>(GoalService)
}
