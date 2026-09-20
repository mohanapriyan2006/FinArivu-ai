import {
  reduceActionUiState,
  type ActionUiState,
} from '../actionUiState'
import type { ActionPreview, ActionResult } from '@/types/actions'

const preview: ActionPreview = {
  executionId: 'e1',
  operation: 'UPDATE_BUDGET',
  status: 'AWAITING_CONFIRMATION',
  title: 'Update Food budget',
  entityName: 'Food',
  before: { monthlyLimit: 12000 },
  after: { monthlyLimit: 8000 },
  impact: {},
  affectedAreas: ['budgets'],
  requiresConfirmation: true,
  missingFields: [],
}

const result: ActionResult = {
  executionId: 'e1',
  status: 'EXECUTED',
  operation: 'UPDATE_BUDGET',
  title: 'Update Food budget',
  entityName: 'Food',
  result: { entityId: 'b1', before: {}, after: {} },
  impact: {},
  affectedAreas: [],
  undoAvailable: true,
  message: 'Done',
}

describe('reduceActionUiState', () => {
  it('walks the happy path idle → preparing → ready → confirming → executed', () => {
    let state: ActionUiState = { kind: 'idle' }
    state = reduceActionUiState(state, { type: 'prepare_started' })
    expect(state.kind).toBe('preparing')
    state = reduceActionUiState(state, { type: 'preview_ready', preview })
    expect(state).toEqual({ kind: 'ready', preview })
    state = reduceActionUiState(state, { type: 'confirm_started' })
    expect(state).toEqual({ kind: 'confirming', preview })
    state = reduceActionUiState(state, { type: 'executed', result })
    expect(state).toEqual({ kind: 'executed', result })
  })

  it('maps NEEDS_INPUT previews to a clarification state', () => {
    let state = reduceActionUiState({ kind: 'idle' }, { type: 'prepare_started' })
    state = reduceActionUiState(state, {
      type: 'needs_input',
      question: 'What amount?',
      missingFields: ['amount'],
    })
    expect(state).toEqual({
      kind: 'needs_input',
      question: 'What amount?',
      missingFields: ['amount'],
    })
  })

  it('supports undo transitions', () => {
    let state = reduceActionUiState({ kind: 'idle' }, { type: 'executed', result })
    state = reduceActionUiState(state, { type: 'undo_started' })
    expect(state).toEqual({ kind: 'undoing', executionId: 'e1' })
    state = reduceActionUiState(state, {
      type: 'undone',
      result: { ...result, status: 'UNDONE' },
    })
    expect(state.kind).toBe('undone')
  })

  it('rejects illegal transitions', () => {
    const idle: ActionUiState = { kind: 'idle' }
    expect(reduceActionUiState(idle, { type: 'confirm_started' })).toBe(idle)
    expect(reduceActionUiState(idle, { type: 'preview_ready', preview })).toBe(idle)
  })

  it('handles failures and reset', () => {
    let state = reduceActionUiState({ kind: 'idle' }, { type: 'prepare_started' })
    state = reduceActionUiState(state, { type: 'failed', message: 'nope' })
    expect(state).toEqual({ kind: 'error', message: 'nope' })
    expect(reduceActionUiState(state, { type: 'reset' })).toEqual({ kind: 'idle' })
  })
})
