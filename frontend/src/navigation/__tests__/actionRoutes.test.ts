import {
  ACTION_TARGETS,
  isActionNavTarget,
  navigateToAction,
  resolveActionRoute,
} from '@/navigation/actionRoutes'

describe('actionRoutes', () => {
  it('whitelists exactly the backend navigation targets', () => {
    // Keep in sync with NAVIGATION_TARGETS in
    // backend/app/ai/orchestrator/action_decision_engine.py
    expect([...ACTION_TARGETS].sort()).toEqual([
      'budget',
      'credit_cards',
      'expenses',
      'financial_health',
      'goals',
      'insights',
      'insurance',
      'investments',
      'loans',
      'pulse',
      'reports',
      'savings',
      'scenario_lab',
    ])
  })

  it('resolves scenario_lab with an optional scenarioType param', () => {
    const dest = resolveActionRoute({ type: 'NAVIGATE', route: 'scenario_lab' })
    expect(dest).toEqual({ kind: 'stack', screen: 'ScenarioLab' })
    const navigation = { navigate: jest.fn() } as any
    const handled = navigateToAction(navigation, {
      type: 'NAVIGATE',
      route: 'scenario_lab',
      payload: { scenarioType: 'PURCHASE' },
    })
    expect(handled).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledWith('ScenarioLab', {
      scenarioType: 'PURCHASE',
    })
  })

  it('recognises valid targets and rejects others', () => {
    expect(isActionNavTarget('budget')).toBe(true)
    expect(isActionNavTarget('pulse')).toBe(true)
    expect(isActionNavTarget('execute_payment')).toBe(false)
    expect(isActionNavTarget('BudgetTracker')).toBe(false)
    expect(isActionNavTarget(undefined)).toBe(false)
    expect(isActionNavTarget(42)).toBe(false)
  })

  it('resolves NAVIGATE actions to stack screens', () => {
    const dest = resolveActionRoute({
      type: 'NAVIGATE',
      route: 'goals',
    })
    expect(dest).toEqual({ kind: 'stack', screen: 'GoalsTracker' })
  })

  it('resolves tab targets through the Main navigator', () => {
    expect(resolveActionRoute({ type: 'NAVIGATE', route: 'pulse' })).toEqual({
      kind: 'tab',
      tab: 'Pulse',
    })
    expect(resolveActionRoute({ type: 'NAVIGATE', route: 'insights' })).toEqual({
      kind: 'tab',
      tab: 'Insights',
    })
  })

  it('falls back to legacy payload.screen', () => {
    const dest = resolveActionRoute({
      type: 'NAVIGATE',
      route: null,
      payload: { screen: 'expenses' },
    })
    expect(dest).toEqual({ kind: 'stack', screen: 'ExpenseTracker' })
  })

  it('ignores non-navigate, disabled, and unknown actions', () => {
    expect(resolveActionRoute({ type: 'CHAT_FOLLOWUP', route: 'budget' })).toBeNull()
    expect(resolveActionRoute({ type: 'API_ACTION', route: 'budget' })).toBeNull()
    expect(
      resolveActionRoute({ type: 'NAVIGATE', route: 'budget', enabled: false })
    ).toBeNull()
    expect(resolveActionRoute({ type: 'NAVIGATE', route: 'hack_screen' })).toBeNull()
    expect(resolveActionRoute({ type: 'NAVIGATE' })).toBeNull()
  })

  it('navigates stack destinations without casts', () => {
    const navigation = { navigate: jest.fn() } as any
    const handled = navigateToAction(navigation, {
      type: 'NAVIGATE',
      route: 'financial_health',
    })
    expect(handled).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledWith('FinancialHealth')
  })

  it('navigates tab destinations via the Main navigator', () => {
    const navigation = { navigate: jest.fn() } as any
    const handled = navigateToAction(navigation, {
      type: 'NAVIGATE',
      route: 'insights',
    })
    expect(handled).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledWith('Main', { screen: 'Insights' })
  })

  it('returns false for non-navigable actions', () => {
    const navigation = { navigate: jest.fn() } as any
    expect(navigateToAction(navigation, { type: 'NAVIGATE', route: 'nope' })).toBe(false)
    expect(navigation.navigate).not.toHaveBeenCalled()
  })
})
