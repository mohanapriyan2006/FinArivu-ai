import {
  dismissInsight,
  getInsight,
  getRadarSummary,
  listInsights,
  markInsightSeen,
  scanRadar,
} from '../MoneyRadarService'

jest.mock('../api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

import { api } from '../api'

const mockedPost = api.post as jest.Mock
const mockedGet = api.get as jest.Mock

const summaryPayload = {
  generatedAt: '2026-09-21T10:00:00Z',
  activeCount: 3,
  highCount: 1,
  mediumCount: 1,
  lowCount: 0,
  infoCount: 1,
  resolvedCount: 2,
  attentionCount: 2,
  opportunityCount: 1,
  coverage: [],
  insights: [],
  radarVersion: 'money_radar_v1',
}

describe('MoneyRadarService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('posts a scan and unwraps the summary', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: summaryPayload } })
    const summary = await scanRadar()
    expect(mockedPost).toHaveBeenCalledWith('/v1/money-radar/scan')
    expect(summary.activeCount).toBe(3)
    expect(summary.radarVersion).toBe('money_radar_v1')
  })

  it('fetches the persisted summary', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: summaryPayload } })
    const summary = await getRadarSummary()
    expect(mockedGet).toHaveBeenCalledWith('/v1/money-radar/summary')
    expect(summary.resolvedCount).toBe(2)
  })

  it('lists insights with serialised filters', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: { items: [], total: 0, skip: 0, limit: 50 } },
    })
    await listInsights({
      status: ['ACTIVE', 'SEEN'],
      severity: ['HIGH'],
      insightType: ['BUDGET_RISK'],
      skip: 10,
      limit: 20,
    })
    expect(mockedGet).toHaveBeenCalledWith('/v1/money-radar/insights', {
      params: {
        status: 'ACTIVE,SEEN',
        severity: 'HIGH',
        insight_type: 'BUDGET_RISK',
        category: undefined,
        entity_type: undefined,
        created_after: undefined,
        created_before: undefined,
        skip: 10,
        limit: 20,
      },
    })
  })

  it('fetches a single insight', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: { id: 'i1', evidence: [] } },
    })
    const insight = await getInsight('i1')
    expect(mockedGet).toHaveBeenCalledWith('/v1/money-radar/insights/i1')
    expect(insight.id).toBe('i1')
  })

  it('marks seen and dismisses via lifecycle endpoints', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: { status: 'SEEN' } } })
    const seen = await markInsightSeen('i1')
    expect(mockedPost).toHaveBeenCalledWith(
      '/v1/money-radar/insights/i1/seen',
    )
    expect(seen.status).toBe('SEEN')

    mockedPost.mockResolvedValueOnce({
      data: { data: { status: 'DISMISSED' } },
    })
    const dismissed = await dismissInsight('i1')
    expect(mockedPost).toHaveBeenCalledWith(
      '/v1/money-radar/insights/i1/dismiss',
    )
    expect(dismissed.status).toBe('DISMISSED')
  })

  it('surfaces controlled backend errors', async () => {
    mockedPost.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: 'That insight does not exist.', error_code: 'INSIGHT_NOT_FOUND' },
      },
    })
    await expect(dismissInsight('nope')).rejects.toMatchObject({
      message: 'That insight does not exist.',
      code: 'INSIGHT_NOT_FOUND',
      status: 404,
    })
  })
})
