/**
 * Canonical resolution of copilot NAVIGATE actions to registered screens.
 *
 * The backend emits a semantic `route` target key (see
 * `backend/app/ai/orchestrator/action_decision_engine.py :: NAVIGATION_TARGETS`).
 * This module whitelists those keys and maps them to real React Navigation
 * routes — unknown or disabled actions resolve to `null` and are ignored.
 */
import type { NavigationProp } from '@react-navigation/native'

import type { CopilotSuggestedAction } from '@/types/copilot'
import type { MainTabParamList, RootStackParamList } from '@/types/navigation'

/** Navigation targets the backend may emit (kept in sync with backend). */
export const ACTION_TARGETS = [
  'expenses',
  'budget',
  'goals',
  'savings',
  'investments',
  'loans',
  'insurance',
  'credit_cards',
  'financial_health',
  'reports',
  'pulse',
  'insights',
  'money_radar',
  'scenario_lab',
  'action_plan',
] as const

export type ActionNavTarget = (typeof ACTION_TARGETS)[number]

export type ActionDestination =
  | { kind: 'stack'; screen: keyof RootStackParamList }
  | { kind: 'tab'; tab: keyof MainTabParamList }

/** Whitelist mapping from backend target keys to registered routes. */
const ACTION_ROUTE_MAP: Record<ActionNavTarget, ActionDestination> = {
  expenses: { kind: 'stack', screen: 'ExpenseTracker' },
  budget: { kind: 'stack', screen: 'BudgetTracker' },
  goals: { kind: 'stack', screen: 'GoalsTracker' },
  savings: { kind: 'stack', screen: 'SavingsTracker' },
  investments: { kind: 'stack', screen: 'InvestmentTracker' },
  loans: { kind: 'stack', screen: 'LoanTracker' },
  insurance: { kind: 'stack', screen: 'InsuranceTracker' },
  credit_cards: { kind: 'stack', screen: 'CreditCardTracker' },
  financial_health: { kind: 'stack', screen: 'FinancialHealth' },
  reports: { kind: 'stack', screen: 'WeeklyReport' },
  pulse: { kind: 'tab', tab: 'Pulse' },
  insights: { kind: 'tab', tab: 'Insights' },
  money_radar: { kind: 'tab', tab: 'Insights' },
  scenario_lab: { kind: 'stack', screen: 'ScenarioLab' },
  action_plan: { kind: 'stack', screen: 'FinancialActionPlan' },
}

export function isActionNavTarget(value: unknown): value is ActionNavTarget {
  return (
    typeof value === 'string' &&
    (ACTION_TARGETS as readonly string[]).includes(value)
  )
}

/**
 * Resolve a suggested action to a navigable destination.
 *
 * Returns `null` for disabled actions, non-NAVIGATE types (CHAT_FOLLOWUP is
 * handled by re-sending the label; API_ACTION is never executed in Phase 0),
 * and unknown/legacy targets.
 */
export function resolveActionRoute(
  action: Pick<CopilotSuggestedAction, 'type' | 'route' | 'payload' | 'enabled'>
): ActionDestination | null {
  if (action.type !== 'NAVIGATE' || action.enabled === false) {
    return null
  }
  // Canonical field is `route`; fall back to legacy `payload.screen`.
  const legacy =
    typeof action.payload?.screen === 'string' ? action.payload.screen : undefined
  const target = action.route ?? legacy
  if (!isActionNavTarget(target)) {
    return null
  }
  return ACTION_ROUTE_MAP[target]
}

/**
 * Navigate for a resolved copilot action. Returns false when the action is
 * not navigable so callers can ignore it silently.
 */
export function navigateToAction(
  navigation: NavigationProp<RootStackParamList>,
  action: Pick<CopilotSuggestedAction, 'type' | 'route' | 'payload' | 'enabled'>
): boolean {
  const destination = resolveActionRoute(action)
  if (!destination) {
    return false
  }

  if (destination.kind === 'tab') {
    navigation.navigate('Main', { screen: destination.tab })
    return true
  }

  // Literal-name calls keep the param list fully typed — no casts.
  switch (destination.screen) {
    case 'ExpenseTracker':
      navigation.navigate('ExpenseTracker')
      return true
    case 'BudgetTracker':
      navigation.navigate('BudgetTracker')
      return true
    case 'GoalsTracker':
      navigation.navigate('GoalsTracker')
      return true
    case 'SavingsTracker':
      navigation.navigate('SavingsTracker')
      return true
    case 'InvestmentTracker':
      navigation.navigate('InvestmentTracker')
      return true
    case 'LoanTracker':
      navigation.navigate('LoanTracker')
      return true
    case 'InsuranceTracker':
      navigation.navigate('InsuranceTracker')
      return true
    case 'CreditCardTracker':
      navigation.navigate('CreditCardTracker')
      return true
    case 'FinancialHealth':
      navigation.navigate('FinancialHealth')
      return true
    case 'WeeklyReport':
      navigation.navigate('WeeklyReport')
      return true
    case 'FinancialActionPlan':
      navigation.navigate('FinancialActionPlan', {
        planId:
          typeof action.payload?.planId === 'string'
            ? action.payload.planId
            : undefined,
      })
      return true
    case 'ScenarioLab':
      navigation.navigate('ScenarioLab', {
        scenarioType:
          typeof action.payload?.scenarioType === 'string'
            ? action.payload.scenarioType
            : undefined,
      })
      return true
    default:
      return false
  }
}
