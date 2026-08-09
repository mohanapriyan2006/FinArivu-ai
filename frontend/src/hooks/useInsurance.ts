import { useMemo } from 'react'

import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import type { InsurancePolicy } from '@/types/financialProfile'

export function useInsurance() {
  const { profile, loading } = useFinancialProfile()
  const policies = useMemo<InsurancePolicy[]>(() => {
    if (!profile?.insurance?.policies) return []
    return profile.insurance.policies
  }, [profile])

  return {
    data: policies,
    isLoading: loading,
    error: null,
    refresh: async () => {},
    create: async () => {
      throw new Error('Insurance records require a dedicated backend endpoint that is not yet available.')
    },
    update: async () => {
      throw new Error('Insurance records require a dedicated backend endpoint that is not yet available.')
    },
    delete: async () => {
      throw new Error('Insurance records require a dedicated backend endpoint that is not yet available.')
    },
  }
}
