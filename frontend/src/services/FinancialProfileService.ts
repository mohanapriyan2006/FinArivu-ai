import { api } from './api'
import { FinancialProfileStore } from './FinancialProfileStore'
import type {
  FinancialProfile,
  ProfileCompletion,
  ProfileSectionId,
  SectionUpdate,
} from '@/types/financialProfile'
import { calculateCompletion, getLastIncompleteSection } from '@/utils/profileCompletion'

/**
 * Maps a frontend SectionUpdate payload to the snake_case shape expected by the
 * backend `PUT /v1/financial-profile/{section}` endpoint.
 */
function buildBackendPayload(update: SectionUpdate): Record<string, unknown> {
  switch (update.section) {
    case 'aboutYou': {
      const d = update.data
      return {
        age: d.age,
        employment_type: d.employmentType,
        city: d.city,
        dependents: d.dependents,
        children_count: d.children,
      }
    }
    case 'income': {
      const d = update.data
      return {
        amount: d.monthlyTakeHome,
        source: 'Salary',
        frequency: 'monthly',
        is_recurring: true,
        is_primary: true,
      }
    }
    case 'expenses': {
      const d = update.data
      const breakdown = Object.entries(d.breakdown ?? {}).map(([, amount]) => ({
        category_id: null,
        amount: amount ?? 0,
      }))
      return {
        total_amount: d.totalMonthlyExpenses,
        source: 'manual_estimate',
        breakdown,
      }
    }
    case 'savings': {
      const d = update.data
      return {
        emergency_fund: d.emergencyFund ?? 0,
        general_savings: d.generalSavings ?? 0,
        goal_savings: d.goalSavings ?? 0,
      }
    }
    case 'investments': {
      const d = update.data
      if (!d.hasInvestments) return { items: [] }
      const b = d.breakdown ?? {}
      const items: { asset_type: string; name: string; value: number }[] = []
      if (b.mutualFunds) items.push({ asset_type: 'Mutual Fund', name: 'Mutual Funds', value: b.mutualFunds })
      if (b.stocks) items.push({ asset_type: 'Stock', name: 'Stocks', value: b.stocks })
      if (b.ppf) items.push({ asset_type: 'PPF', name: 'PPF', value: b.ppf })
      if (b.nps) items.push({ asset_type: 'NPS', name: 'NPS', value: b.nps })
      if (b.gold) items.push({ asset_type: 'Gold', name: 'Gold', value: b.gold })
      if (b.other) items.push({ asset_type: 'Other', name: 'Other Investments', value: b.other })
      if (items.length === 0 && d.totalInvestmentValue) {
        items.push({ asset_type: 'Other', name: 'Investments', value: d.totalInvestmentValue })
      }
      return { items }
    }
    case 'loans': {
      const d = update.data
      if (!d.hasLoans) return { items: [] }
      const typeMap: Record<string, string> = {
        home: 'Home Loan',
        personal: 'Personal Loan',
        car: 'Car Loan',
        education: 'Education Loan',
        consumer: 'Other',
        other: 'Other',
      }
      return {
        items: (d.loans ?? []).map((loan) => ({
          liability_type: typeMap[loan.type] ?? 'Other',
          name: `${typeMap[loan.type] ?? 'Loan'}`,
          outstanding_amount: loan.outstandingAmount,
          monthly_emi: loan.monthlyEmi,
          interest_rate: loan.interestRate,
          remaining_months: loan.remainingTenure,
        })),
      }
    }
    case 'goals': {
      const d = update.data
      return {
        items: d.goals.map((goal) => ({
          goal_name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentSavedAmount ?? 0,
          target_date: `${goal.targetYear}-12-31`,
          priority: 'Medium',
        })),
      }
    }
    case 'fixedDeposits': {
      const d = update.data
      return {
        items: d.fds.map((fd) => ({
          name: 'Fixed Deposit',
          value: fd.value,
          interest_rate: fd.interestRate,
          maturity_date: fd.maturityYear ? `${fd.maturityYear}-12-31` : null,
          description: fd.purpose,
        })),
      }
    }
    case 'creditCards': {
      const d = update.data
      return {
        current_outstanding: d.totalOutstanding,
        typical_monthly_payment: d.typicalMonthlyPayment,
        credit_limit: d.totalCreditLimit,
        monthly_spend: d.monthlySpending,
      }
    }
    case 'insurance': {
      const d = update.data
      const typeMap: Record<string, string> = { health: 'Health', life: 'Life' }
      return {
        items: d.policies.map((policy) => ({
          insurance_type: typeMap[policy.type] ?? policy.type,
          coverage_amount: policy.coverage,
          annual_premium: policy.annualPremium,
        })),
      }
    }
    case 'taxDetails': {
      const d = update.data
      const regime = d.taxRegime === 'not-sure' ? 'new' : d.taxRegime
      return {
        annual_income: d.annualIncome,
        tax_regime: regime,
        deduction_80c: d.deductions?.['80c'],
        deduction_80d: d.deductions?.['80d'],
        home_loan_interest: d.deductions?.homeLoanInterest,
        nps_deduction: d.deductions?.nps,
        other_deductions: d.deductions?.other,
      }
    }
    default:
      return {}
  }
}

/** Frontend section id → backend section path segment. */
function backendSection(section: ProfileSectionId): string {
  return section === 'taxDetails' ? 'taxProfile' : section
}

export const FinancialProfileService = {
  async getProfile(userId: string, token?: string | null): Promise<FinancialProfile | null> {
    if (token) {
      try {
        const response = await api.get('/v1/financial-profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = response.data?.data
        if (data) {
          // The backend returns a rich profile; we only need enough to drive
          // the onboarding stepper, so we keep the local store as the source
          // of truth for the stepper state and merge completion info.
          return FinancialProfileStore.getProfile(userId)
        }
      } catch {
        // fall through to local store
      }
    }
    return FinancialProfileStore.getProfile(userId)
  },

  async saveProfile(userId: string, profile: FinancialProfile): Promise<void> {
    return FinancialProfileStore.saveProfile(userId, profile)
  },

  async updateProfileSection(
    userId: string,
    update: SectionUpdate,
    token?: string | null
  ): Promise<FinancialProfile> {
    // Always update the local store first so the stepper UI stays responsive.
    const next = await FinancialProfileStore.updateSection(userId, update)

    if (token) {
      try {
        await api.put(
          `/v1/financial-profile/${backendSection(update.section)}`,
          buildBackendPayload(update),
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error) {
        console.warn(
          `[FinancialProfileService] backend save failed for ${update.section}:`,
          error
        )
      }
    }
    return next
  },

  async getCompletion(userId: string): Promise<ProfileCompletion | null> {
    const profile = await this.getProfile(userId)
    if (!profile) return null
    return calculateCompletion(profile)
  },

  async getLastIncompleteSection(
    userId: string
  ): Promise<ProfileSectionId | null> {
    const profile = await this.getProfile(userId)
    return getLastIncompleteSection(profile)
  },
}
