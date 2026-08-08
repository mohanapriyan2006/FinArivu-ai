export type EmploymentType =
  | 'salaried'
  | 'self-employed'
  | 'freelance'
  | 'business'
  | 'other'

export type ExpenseCategory =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'shopping'
  | 'travel'
  | 'entertainment'
  | 'healthcare'
  | 'education'
  | 'other'

export type LoanType =
  | 'home'
  | 'personal'
  | 'car'
  | 'education'
  | 'consumer'
  | 'other'

export type GoalType =
  | 'home'
  | 'vehicle'
  | 'education'
  | 'travel'
  | 'emergency'
  | 'retirement'
  | 'marriage'
  | 'wealth'
  | 'other'

export type InsuranceType = 'health' | 'life'

export type TaxRegime = 'old' | 'new' | 'not-sure'

export interface AboutYouProfile {
  age: number
  employmentType: EmploymentType
  city: string
  dependents?: number
  children?: number
}

export interface AdditionalIncome {
  bonus?: number
  freelance?: number
  rental?: number
  business?: number
  other?: number
}

export interface IncomeProfile {
  monthlyTakeHome: number
  isAnnual: boolean
  additional?: AdditionalIncome
}

export interface ExpenseProfile {
  totalMonthlyExpenses: number
  breakdown?: Partial<Record<ExpenseCategory, number>>
}

export interface SavingsProfile {
  totalSavings: number
  emergencyFund?: number
  generalSavings?: number
  goalSavings?: number
}

export interface InvestmentBreakdown {
  mutualFunds?: number
  stocks?: number
  ppf?: number
  nps?: number
  gold?: number
  other?: number
}

export interface InvestmentProfile {
  hasInvestments: boolean
  totalInvestmentValue?: number
  breakdown?: InvestmentBreakdown
}

export interface Loan {
  id: string
  type: LoanType
  outstandingAmount: number
  monthlyEmi: number
  interestRate?: number
  remainingTenure?: number
}

export interface LoanProfile {
  hasLoans: boolean
  loans?: Loan[]
}

export interface Goal {
  id: string
  type: GoalType
  name: string
  targetAmount: number
  targetYear: number
  currentSavedAmount?: number
  monthlyContribution?: number
}

export interface GoalProfile {
  goals: Goal[]
}

export interface FixedDeposit {
  id: string
  value: number
  interestRate?: number
  maturityYear?: number
  purpose?: string
}

export interface FDProfile {
  totalValue: number
  fds: FixedDeposit[]
}

export interface CreditCardProfile {
  totalOutstanding: number
  typicalMonthlyPayment: number
  totalCreditLimit?: number
  monthlySpending?: number
}

export interface InsurancePolicy {
  id: string
  type: InsuranceType
  coverage?: number
  annualPremium?: number
}

export interface InsuranceProfile {
  policies: InsurancePolicy[]
}

export interface TaxDeductions {
  '80c'?: number
  '80d'?: number
  homeLoanInterest?: number
  nps?: number
  other?: number
}

export interface TaxProfile {
  annualIncome: number
  taxRegime: TaxRegime
  deductions?: TaxDeductions
}

export type ProfileSectionId =
  | 'aboutYou'
  | 'income'
  | 'expenses'
  | 'savings'
  | 'investments'
  | 'loans'
  | 'goals'
  | 'fixedDeposits'
  | 'creditCards'
  | 'insurance'
  | 'taxDetails'

export type OnboardingStepId =
  | 'aboutYou'
  | 'income'
  | 'expenses'
  | 'savings'
  | 'investments'
  | 'loans'
  | 'goals'
  | 'optionalDetails'
  | 'fixedDeposits'
  | 'creditCards'
  | 'insurance'
  | 'taxDetails'
  | 'completion'

export interface FinancialProfile {
  userId?: string
  initialized: boolean
  initializedAt?: string
  completedAt?: string
  aboutYou?: AboutYouProfile
  income?: IncomeProfile
  expenses?: ExpenseProfile
  savings?: SavingsProfile
  investments?: InvestmentProfile
  loans?: LoanProfile
  goals?: GoalProfile
  fixedDeposits?: FDProfile
  creditCards?: CreditCardProfile
  insurance?: InsuranceProfile
  taxDetails?: TaxProfile
}

export interface SectionCompletion {
  id: ProfileSectionId
  title: string
  shortTitle: string
  weight: number
  complete: boolean
  contribution: number
}

export interface ProfileCompletion {
  percentage: number
  completedSections: ProfileSectionId[]
  incompleteSections: ProfileSectionId[]
  missingSections: ProfileSectionId[]
  lastIncompleteSection: ProfileSectionId | null
  bySection: Record<ProfileSectionId, SectionCompletion>
}

export interface ProfileSectionConfig {
  id: ProfileSectionId
  title: string
  shortTitle: string
  weight: number
  isOptional: boolean
  isComplete: (profile: FinancialProfile) => boolean
}

export type SectionUpdate =
  | { section: 'aboutYou'; data: AboutYouProfile }
  | { section: 'income'; data: IncomeProfile }
  | { section: 'expenses'; data: ExpenseProfile }
  | { section: 'savings'; data: SavingsProfile }
  | { section: 'investments'; data: InvestmentProfile }
  | { section: 'loans'; data: LoanProfile }
  | { section: 'goals'; data: GoalProfile }
  | { section: 'fixedDeposits'; data: FDProfile }
  | { section: 'creditCards'; data: CreditCardProfile }
  | { section: 'insurance'; data: InsuranceProfile }
  | { section: 'taxDetails'; data: TaxProfile }
