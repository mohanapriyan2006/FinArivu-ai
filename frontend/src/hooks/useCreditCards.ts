import { useMemo } from 'react'

import { useTrackerList } from './useTrackerList'
import { LiabilityService, type Liability, type LiabilityInput } from '@/services/LiabilityService'

export function useCreditCards() {
  const { data, ...rest } = useTrackerList<Liability, LiabilityInput>(LiabilityService)
  const cards = useMemo(() => data.filter((l) => l.liabilityType === 'Credit Card'), [data])
  return { data: cards, ...rest }
}
