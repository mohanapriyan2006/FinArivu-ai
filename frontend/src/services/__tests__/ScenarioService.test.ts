import {
  compareScenarios,
  deleteScenario,
  getScenario,
  getScenarioTypes,
  listScenarios,
  rerunScenario,
  runScenario,
  saveScenario,
} from '../ScenarioService'

jest.mock('../api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}))

import { api } from '../api'

const mockedPost = api.post as jest.Mock
const mockedGet = api.get as jest.Mock
const mockedDelete = api.delete as jest.Mock

const RESULT = {
  scenarioType: 'INCOME_CHANGE',
  title: 'Income change',
  status: 'COMPUTED',
  metrics: [
    {
      key: 'monthlySurplus',
      label: 'Monthly surplus',
      before: 40000,
      after: 50000,
      change: 10000,
      unit: 'currency',
      direction: 'IMPROVES',
    },
  ],
  assumptions: [],
}

describe('ScenarioService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('runs a scenario with snake_case wire fields', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: RESULT } })
    const result = await runScenario({
      scenarioType: 'INCOME_CHANGE',
      parameters: { changeType: 'percent', changeValue: 10 },
      sessionId: 's1',
    })
    expect(mockedPost).toHaveBeenCalledWith('/v1/scenarios/run', {
      scenario_type: 'INCOME_CHANGE',
      parameters: { changeType: 'percent', changeValue: 10 },
      title: undefined,
      session_id: 's1',
    })
    expect(result.status).toBe('COMPUTED')
    expect(result.metrics[0].after).toBe(50000)
  })

  it('saves a scenario and returns the persisted id', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { ...RESULT, scenarioId: 'sc-1' } },
    })
    const result = await saveScenario({
      scenarioType: 'PURCHASE',
      parameters: { purchaseAmount: 1000 },
      title: 'Laptop',
    })
    expect(mockedPost).toHaveBeenCalledWith('/v1/scenarios/save', {
      scenario_type: 'PURCHASE',
      parameters: { purchaseAmount: 1000 },
      title: 'Laptop',
      session_id: undefined,
    })
    expect(result.scenarioId).toBe('sc-1')
  })

  it('lists saved scenarios', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [{ id: 'h1', title: 'Raise' }] },
    })
    const items = await listScenarios(20, 5)
    expect(mockedGet).toHaveBeenCalledWith('/v1/scenarios', {
      params: { limit: 20, offset: 5 },
    })
    expect(items).toHaveLength(1)
  })

  it('fetches and re-runs a saved scenario', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: RESULT } })
    const fetched = await getScenario('sc-1')
    expect(mockedGet).toHaveBeenCalledWith('/v1/scenarios/sc-1')
    expect(fetched.status).toBe('COMPUTED')

    mockedPost.mockResolvedValueOnce({ data: { data: RESULT } })
    await rerunScenario('sc-1')
    expect(mockedPost).toHaveBeenCalledWith('/v1/scenarios/sc-1/rerun')
  })

  it('compares inline and saved scenarios', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { titles: ['A', 'B'], rows: [] } },
    })
    const result = await compareScenarios(
      [{ scenarioType: 'INCOME_CHANGE', parameters: { changeValue: 10 } }],
      ['sc-9'],
    )
    expect(mockedPost).toHaveBeenCalledWith('/v1/scenarios/compare', {
      scenarios: [
        {
          scenario_type: 'INCOME_CHANGE',
          parameters: { changeValue: 10 },
          title: undefined,
        },
      ],
      scenario_ids: ['sc-9'],
    })
    expect(result.titles).toEqual(['A', 'B'])
  })

  it('deletes a scenario', async () => {
    mockedDelete.mockResolvedValueOnce({ data: {} })
    await deleteScenario('sc-1')
    expect(mockedDelete).toHaveBeenCalledWith('/v1/scenarios/sc-1')
  })

  it('lists scenario types', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [{ type: 'PURCHASE', label: 'Purchase' }] },
    })
    const types = await getScenarioTypes()
    expect(types[0].type).toBe('PURCHASE')
  })

  it('surfaces controlled backend errors', async () => {
    mockedPost.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'Compare supports at most 3 scenarios.',
          error_code: 'COMPARISON_LIMIT',
        },
      },
    })
    await expect(compareScenarios([])).rejects.toMatchObject({
      message: 'Compare supports at most 3 scenarios.',
      code: 'COMPARISON_LIMIT',
      status: 422,
    })
  })
})
