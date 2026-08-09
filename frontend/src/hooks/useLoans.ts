import { useMemo } from 'react'

import { useTrackerList } from './useTrackerList'
import { LiabilityService, type Liability, type LiabilityInput } from '@/services/LiabilityService'

export function useLoans() {
  const { data, ...rest } = useTrackerList<Liability, LiabilityInput>(LiabilityService)
  const loans = useMemo(() => data.filter((l) => l.liabilityType !== 'Credit Card'), [data])
  return { data: loans, ...rest }
}
