import type { NavigatorScreenParams } from '@react-navigation/native'

export type MainTabParamList = {
  Home: undefined
  Pulse: undefined
  AICopilot: undefined
  Insights: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Splash: undefined
  Onboarding: undefined
  Auth: undefined
  Main: NavigatorScreenParams<MainTabParamList> | undefined
  FinancialProfileSetup: { startStep?: string } | undefined
  Notifications: undefined
  WeeklyReport: undefined
  ExpenseTracker: undefined
  BudgetTracker: undefined
  SavingsTracker: undefined
  InvestmentTracker: undefined
  GoalsTracker: undefined
  LoanTracker: undefined
  CreditCardTracker: undefined
  InsuranceTracker: undefined
  PulseSectionList: { section: string }
  PulseSectionCreate: { section: string; record?: Record<string, unknown> }
  FinancialHealth: undefined
}
