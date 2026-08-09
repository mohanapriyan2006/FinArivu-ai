import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuthContext } from '@/contexts/AuthContext'
import { InsightService } from '@/services/InsightService'
import type { InsightsResponse, InsightsViewModel, UseInsightsResult } from './types'

import { buildInsightsState } from './insightsViewModel'

export function useInsights(): UseInsightsResult {
  const { getToken } = useAuthContext()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<InsightsResponse | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const data = await InsightService.getInsights(token)
      setResponse(data)
    } catch (err) {
      setResponse(null)
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

  const state = useMemo<InsightsViewModel>(() => {
    if (!response) {
      return buildInsightsState({
        hasData: false,
        health: null,
        topInsight: null,
        weekly: [],
        trends: [],
        attention: [],
        positive: [],
        missing: [],
      })
    }
    return buildInsightsState(response)
  }, [response])

  return { state, isLoading, error, refetch: fetchData }
}
