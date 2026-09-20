import { useMemo } from 'react'

import { useTrackerList } from './useTrackerList'
import { AssetService, type Asset, type AssetInput } from '@/services/AssetService'
import { FIXED_TYPES, SAVINGS_TYPES } from '@/screens/Pulse/sectionConfig'

export function useInvestments() {
  const { data, ...rest } = useTrackerList<Asset, AssetInput>(AssetService)
  const investments = useMemo(
    () => data.filter((a) => !SAVINGS_TYPES.has(a.assetType) && !FIXED_TYPES.has(a.assetType)),
    [data]
  )
  return { data: investments, ...rest }
}
