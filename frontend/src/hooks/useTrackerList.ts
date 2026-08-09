import { useCallback, useEffect, useState } from 'react'

import { useAuthContext } from '@/contexts/AuthContext'

interface ListService<T, TInput> {
  list: (token: string | null) => Promise<T[]>
  create: (data: TInput, token: string | null) => Promise<T>
  update: (id: string, data: Partial<TInput>, token: string | null) => Promise<T>
  delete: (id: string, token: string | null) => Promise<void>
}

export interface UseTrackerListReturn<T, TInput> {
  data: T[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (data: TInput) => Promise<T>
  update: (id: string, data: Partial<TInput>) => Promise<T>
  delete: (id: string) => Promise<void>
}

export function useTrackerList<T, TInput>(
  service: ListService<T, TInput>
): UseTrackerListReturn<T, TInput> {
  const { getToken } = useAuthContext()
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const items = await service.list(token)
      setData(items)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [getToken, service])

  useEffect(() => {
    fetch()
  }, [fetch])

  const create = useCallback(
    async (input: TInput) => {
      const token = await getToken()
      const created = await service.create(input, token)
      await fetch()
      return created
    },
    [getToken, service, fetch]
  )

  const update = useCallback(
    async (id: string, input: Partial<TInput>) => {
      const token = await getToken()
      const updated = await service.update(id, input, token)
      await fetch()
      return updated
    },
    [getToken, service, fetch]
  )

  const deleteItem = useCallback(
    async (id: string) => {
      const token = await getToken()
      await service.delete(id, token)
      await fetch()
    },
    [getToken, service, fetch]
  )

  return { data, isLoading, error, refresh: fetch, create, update, delete: deleteItem }
}
