import {
  isRunnableHistoryItem,
  reduceScenarioUiState,
  scenarioStatusLabel,
  type ScenarioUiState,
} from '../scenarioUiState'
import type { ScenarioResult } from '@/types/scenarios'

const computedResult = {
  scenarioType: 'INCOME_CHANGE',
  status: 'COMPUTED',
  metrics: [],
} as unknown as ScenarioResult

const needsInput = {
  ...computedResult,
  status: 'NEEDS_INPUT',
} as unknown as ScenarioResult

const insufficient = {
  ...computedResult,
  status: 'INSUFFICIENT_DATA',
} as unknown as ScenarioResult

describe('reduceScenarioUiState', () => {
  it('idle → running → result', () => {
    const running = reduceScenarioUiState(
      { kind: 'idle' },
      { type: 'run_started', label: 'INCOME_CHANGE' },
    )
    expect(running.kind).toBe('running')
    const done = reduceScenarioUiState(running, {
      type: 'run_finished',
      result: computedResult,
    })
    expect(done.kind).toBe('result')
  })

  it('running → needs_input when fields are missing', () => {
    const running = reduceScenarioUiState(
      { kind: 'idle' },
      { type: 'run_started', label: 'PURCHASE' },
    )
    const state = reduceScenarioUiState(running, {
      type: 'run_finished',
      result: needsInput,
    })
    expect(state.kind).toBe('needs_input')
  })

  it('running → insufficient_data', () => {
    const running = reduceScenarioUiState(
      { kind: 'idle' },
      { type: 'run_started', label: 'x' },
    )
    const state = reduceScenarioUiState(running, {
      type: 'run_finished',
      result: insufficient,
    })
    expect(state.kind).toBe('insufficient_data')
  })

  it('result → saving → saved', () => {
    const result: ScenarioUiState = { kind: 'result', result: computedResult }
    const saving = reduceScenarioUiState(result, { type: 'save_started' })
    expect(saving.kind).toBe('saving')
    const saved = reduceScenarioUiState(saving, {
      type: 'saved',
      result: computedResult,
    })
    expect(saved.kind).toBe('saved')
  })

  it('save_started is ignored outside result state', () => {
    const idle = reduceScenarioUiState(
      { kind: 'idle' },
      { type: 'save_started' },
    )
    expect(idle.kind).toBe('idle')
  })

  it('comparing → compared', () => {
    const comparing = reduceScenarioUiState(
      { kind: 'result', result: computedResult },
      { type: 'compare_started' },
    )
    expect(comparing.kind).toBe('comparing')
    const compared = reduceScenarioUiState(comparing, {
      type: 'compared',
      comparison: { titles: ['A'], rows: [], engineVersion: 'v1' },
    })
    expect(compared.kind).toBe('compared')
  })

  it('failed → error, reset → idle', () => {
    const err = reduceScenarioUiState(
      { kind: 'running', label: 'x' },
      { type: 'failed', message: 'boom' },
    )
    expect(err).toEqual({ kind: 'error', message: 'boom' })
    expect(reduceScenarioUiState(err, { type: 'reset' }).kind).toBe('idle')
  })
})

describe('helpers', () => {
  it('maps status labels', () => {
    expect(scenarioStatusLabel('COMPUTED')).toBe('Computed')
    expect(scenarioStatusLabel('NEEDS_INPUT')).toBe('Needs input')
    expect(scenarioStatusLabel('INSUFFICIENT_DATA')).toBe('Insufficient data')
  })

  it('marks only COMPUTED history items runnable', () => {
    expect(
      isRunnableHistoryItem({
        status: 'COMPUTED',
      } as never),
    ).toBe(true)
    expect(
      isRunnableHistoryItem({
        status: 'INSUFFICIENT_DATA',
      } as never),
    ).toBe(false)
  })
})
