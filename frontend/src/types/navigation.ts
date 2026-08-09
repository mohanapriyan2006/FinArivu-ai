export type RootStackParamList = {
  Splash: undefined
  Onboarding: undefined
  Auth: undefined
  Main: undefined
  FinancialProfileSetup: { startStep?: string } | undefined
  CreateGoal: undefined
  Notifications: undefined
  QuickAddExpense: undefined
  WeeklyReport: undefined
  ExpenseTracker: undefined
  BudgetTracker: undefined
  SavingsTracker: undefined
  InvestmentTracker: undefined
  GoalsTracker: undefined
  LoanTracker: undefined
  CreditCardTracker: undefined
  InsuranceTracker: undefined
  AddInvestment: undefined
  PulseSectionList: { section: string }
  PulseSectionCreate: { section: string; record?: Record<string, unknown> }
}
