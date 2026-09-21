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
      'action_plan',
      'budget',
      'credit_cards',
      'expenses',
      'financial_health',
      'goals',
      'import_center',
      'insights',
      'insurance',
      'investments',
      'loans',
      'money_radar',
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
    // Money Radar surfaces on the (renamed) Insights tab.
    expect(resolveActionRoute({ type: 'NAVIGATE', route: 'money_radar' })).toEqual({
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

  it('resolves action_plan to the FinancialActionPlan stack screen', () => {
    const dest = resolveActionRoute({ type: 'NAVIGATE', route: 'action_plan' })
    expect(dest).toEqual({ kind: 'stack', screen: 'FinancialActionPlan' })
    const navigation = { navigate: jest.fn() } as any
    const handled = navigateToAction(navigation, {
      type: 'NAVIGATE',
      route: 'action_plan',
      payload: { planId: 'p1' },
    })
    expect(handled).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledWith('FinancialActionPlan', {
      planId: 'p1',
    })
  })

  it('resolves import_center and deep-links batchId to ImportReview', () => {
    const dest = resolveActionRoute({
      type: 'NAVIGATE',
      route: 'import_center',
    })
    expect(dest).toEqual({ kind: 'stack', screen: 'ImportCenter' })
    const navigation = { navigate: jest.fn() } as any
    expect(
      navigateToAction(navigation, {
        type: 'NAVIGATE',
        route: 'import_center',
        payload: { batchId: 'b1' },
      })
    ).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledWith('ImportReview', {
      batchId: 'b1',
    })
    // Without a batchId it lands on the center list.
    navigation.navigate.mockClear()
    navigateToAction(navigation, { type: 'NAVIGATE', route: 'import_center' })
    expect(navigation.navigate).toHaveBeenCalledWith('ImportCenter')
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
