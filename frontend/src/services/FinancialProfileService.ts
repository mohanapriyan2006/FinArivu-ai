import { api } from './api'
import { FinancialProfileStore } from './FinancialProfileStore'
import type {
  AboutYouProfile,
  CreditCardProfile,
  EmploymentType,
  ExpenseProfile,
  FDProfile,
  FinancialProfile,
  GoalProfile,
  GoalType,
  IncomeProfile,
  InsuranceProfile,
  InsuranceType,
  InvestmentBreakdown,
  InvestmentProfile,
  LoanProfile,
  LoanType,
  ProfileCompletion,
  ProfileSectionId,
  SavingsProfile,
  SectionUpdate,
  TaxProfile,
  TaxRegime,
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

function toNum(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

function toNullableNum(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

const BACKEND_LOAN_TYPE: Record<string, LoanType> = {
  'Home Loan': 'home',
  'Car Loan': 'car',
  'Personal Loan': 'personal',
  'Education Loan': 'education',
  'Medical Loan': 'other',
  'Other': 'other',
}

const INVESTMENT_KEYS: Record<string, keyof InvestmentBreakdown> = {
  'Mutual Fund': 'mutualFunds',
  Stock: 'stocks',
  PPF: 'ppf',
  NPS: 'nps',
  Gold: 'gold',
}

function inferGoalType(name: string): GoalType {
  const lower = name.toLowerCase()
  if (lower.includes('home') || lower.includes('house') || lower.includes('flat')) return 'home'
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('bike')) return 'vehicle'
  if (lower.includes('education') || lower.includes('study')) return 'education'
  if (lower.includes('travel') || lower.includes('vacation') || lower.includes('trip')) return 'travel'
  if (lower.includes('emergency')) return 'emergency'
  if (lower.includes('retirement')) return 'retirement'
  if (lower.includes('marriage') || lower.includes('wedding')) return 'marriage'
  if (lower.includes('wealth')) return 'wealth'
  return 'other'
}

function fromBackendProfile(userId: string, data: Record<string, unknown>): FinancialProfile {
  const backendProfile = (data.profile ?? {}) as Record<string, unknown>

  const hasAboutYou =
    backendProfile.age !== undefined &&
    backendProfile.age !== null &&
    backendProfile.employment_type !== undefined &&
    backendProfile.employment_type !== null &&
    backendProfile.city !== undefined &&
    backendProfile.city !== null

  const aboutYou: AboutYouProfile | undefined = hasAboutYou
    ? {
        age: Number(backendProfile.age) || 0,
        employmentType: String(backendProfile.employment_type) as EmploymentType,
        city: String(backendProfile.city || ''),
        dependents: toNullableNum(backendProfile.dependents),
        children: toNullableNum(backendProfile.children_count),
      }
    : undefined

  const incomeData = data.income as Record<string, unknown> | undefined
  const incomeSources = Array.isArray(incomeData?.sources)
    ? (incomeData.sources as Record<string, unknown>[])
    : []
  const monthlyTakeHome =
    toNullableNum(incomeData?.monthly_take_home) ??
    (incomeSources[0] ? toNum(incomeSources[0].amount) : undefined)
  const income: IncomeProfile | undefined =
    monthlyTakeHome !== undefined ? { monthlyTakeHome, isAnnual: false } : undefined

  const expensesData = data.expenses as Record<string, unknown> | undefined
  const expenses: ExpenseProfile | undefined =
    expensesData?.monthly_estimate !== undefined && expensesData.monthly_estimate !== null
      ? { totalMonthlyExpenses: toNum(expensesData.monthly_estimate) }
      : undefined

  const savingsData = data.savings as Record<string, unknown> | undefined
  const savings: SavingsProfile | undefined = savingsData
    ? {
        totalSavings: toNum(savingsData.total),
        emergencyFund: toNullableNum(savingsData.emergency_fund),
        generalSavings: toNullableNum(savingsData.general_savings),
        goalSavings: toNullableNum(savingsData.goal_savings),
      }
    : undefined

  const backendInvestments = Array.isArray(data.investments)
    ? (data.investments as Record<string, unknown>[])
    : []
  const investments: InvestmentProfile | undefined =
    backendInvestments.length > 0
      ? (() => {
          const breakdown: InvestmentBreakdown = {}
          let total = 0
          for (const item of backendInvestments) {
            const value = toNum(item.value)
            total += value
            const type = String(item.asset_type ?? '')
            const key = INVESTMENT_KEYS[type]
            if (key) {
              breakdown[key] = (breakdown[key] ?? 0) + value
            } else {
              breakdown.other = (breakdown.other ?? 0) + value
            }
          }
          return { hasInvestments: true, totalInvestmentValue: total, breakdown }
        })()
      : undefined

  const backendLoans = Array.isArray(data.loans)
    ? (data.loans as Record<string, unknown>[])
    : []
  const loans: LoanProfile | undefined =
    backendLoans.length > 0
      ? {
          hasLoans: true,
          loans: backendLoans.map((loan) => ({
            id: String(loan.id ?? ''),
            type: BACKEND_LOAN_TYPE[String(loan.liability_type ?? '')] ?? 'other',
            outstandingAmount: toNum(loan.amount),
            monthlyEmi: toNum(loan.emi),
            interestRate: toNullableNum(loan.interest_rate),
            remainingTenure: toNullableNum(loan.remaining_tenure_months),
          })),
        }
      : undefined

  const backendGoals = Array.isArray(data.goals)
    ? (data.goals as Record<string, unknown>[])
    : []
  const goals: GoalProfile | undefined =
    backendGoals.length > 0
      ? {
          goals: backendGoals.map((goal) => {
            const name = String(goal.goal_name ?? '')
            const targetDate = String(goal.target_date ?? '')
            const parsed = targetDate ? new Date(targetDate) : null
            const year = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getFullYear() : new Date().getFullYear()
            return {
              id: String(goal.id ?? ''),
              type: inferGoalType(name),
              name,
              targetAmount: toNum(goal.target_amount),
              targetYear: year,
              currentSavedAmount: toNullableNum(goal.current_amount) ?? 0,
            }
          }),
        }
      : undefined

  const backendFds = Array.isArray(data.fixed_deposits)
    ? (data.fixed_deposits as Record<string, unknown>[])
    : []
  const fixedDeposits: FDProfile | undefined =
    backendFds.length > 0
      ? {
          totalValue: backendFds.reduce((sum, fd) => sum + toNum(fd.value), 0),
          fds: backendFds.map((fd) => {
            const md = fd.maturity_date ? new Date(String(fd.maturity_date)) : null
            return {
              id: String(fd.id ?? ''),
              value: toNum(fd.value),
              interestRate: toNullableNum(fd.interest_rate),
              maturityYear: md && !Number.isNaN(md.getTime()) ? md.getFullYear() : undefined,
              purpose: (fd.description as string | undefined) ?? (fd.name as string | undefined) ?? undefined,
            }
          }),
        }
      : undefined

  const backendCards = Array.isArray(data.credit_cards)
    ? (data.credit_cards as Record<string, unknown>[])
    : []
  const creditCards: CreditCardProfile | undefined =
    backendCards.length > 0
      ? {
          totalOutstanding: backendCards.reduce((sum, c) => sum + toNum(c.amount), 0),
          typicalMonthlyPayment: backendCards.reduce((sum, c) => sum + toNum(c.monthly_spend), 0),
          totalCreditLimit: backendCards.reduce((sum, c) => sum + toNum(c.credit_limit), 0),
          monthlySpending: backendCards.reduce((sum, c) => sum + toNum(c.monthly_spend), 0),
        }
      : undefined

  const backendInsurance = Array.isArray(data.insurance)
    ? (data.insurance as Record<string, unknown>[])
    : []
  const insurance: InsuranceProfile | undefined =
    backendInsurance.length > 0
      ? {
          policies: backendInsurance.map((p) => ({
            id: String(p.id ?? ''),
            type: (p.insurance_type === 'health' ? 'health' : 'life') as InsuranceType,
            coverage: toNullableNum(p.coverage_amount),
            annualPremium: toNullableNum(p.annual_premium),
          })),
        }
      : undefined

  const taxData = data.tax_profile as Record<string, unknown> | undefined
  const taxDetails: TaxProfile | undefined = taxData
    ? {
        annualIncome: toNullableNum(taxData.annual_income) ?? 0,
        taxRegime: (taxData.tax_regime === 'old' || taxData.tax_regime === 'new'
          ? taxData.tax_regime
          : 'not-sure') as TaxRegime,
        deductions:
          taxData.deduction_80c !== undefined ||
          taxData.deduction_80d !== undefined ||
          taxData.home_loan_interest !== undefined ||
          taxData.nps_deduction !== undefined ||
          taxData.other_deductions !== undefined
            ? {
                '80c': toNullableNum(taxData.deduction_80c),
                '80d': toNullableNum(taxData.deduction_80d),
                homeLoanInterest: toNullableNum(taxData.home_loan_interest),
                nps: toNullableNum(taxData.nps_deduction),
                other: toNullableNum(taxData.other_deductions),
              }
            : undefined,
      }
    : undefined

  const hasAnyData =
    hasAboutYou ||
    income !== undefined ||
    expenses !== undefined ||
    savings !== undefined ||
    backendInvestments.length > 0 ||
    backendLoans.length > 0 ||
    backendGoals.length > 0 ||
    backendFds.length > 0 ||
    backendCards.length > 0 ||
    backendInsurance.length > 0 ||
    taxDetails !== undefined

  return {
    userId,
    initialized: backendProfile.profile_initialized === true || hasAnyData,
    initializedAt: (backendProfile.completed_at as string | undefined) ?? new Date().toISOString(),
    completedAt: (backendProfile.completed_at as string | undefined) ?? undefined,
    aboutYou,
    income,
    expenses,
    savings,
    investments,
    loans,
    goals,
    fixedDeposits,
    creditCards,
    insurance,
    taxDetails,
  }
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
          const profile = fromBackendProfile(userId, data)
          await FinancialProfileStore.saveProfile(userId, profile)
          return profile
        }
      } catch (error) {
        console.warn('[FinancialProfileService] getProfile backend failed:', error)
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
