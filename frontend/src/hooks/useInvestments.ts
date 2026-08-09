import { useMemo } from 'react'

import { useTrackerList } from './useTrackerList'
import { AssetService, type Asset, type AssetInput } from '@/services/AssetService'

const SAVINGS_TYPES = new Set(['Bank', 'Cash'])

export function useInvestments() {
  const { data, ...rest } = useTrackerList<Asset, AssetInput>(AssetService)
  const investments = useMemo(() => data.filter((a) => !SAVINGS_TYPES.has(a.assetType)), [data])
  return { data: investments, ...rest }
}
