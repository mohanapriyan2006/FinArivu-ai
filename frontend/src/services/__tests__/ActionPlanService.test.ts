import {
  acceptPlanItem,
  addInsightToPlan,
  completePlanItem,
  dismissPlanItem,
  generatePlan,
  getCurrentPlan,
  getPlanHistory,
  snoozePlanItem,
} from '../ActionPlanService'

jest.mock('../api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

import { api } from '../api'

const mockedPost = api.post as jest.Mock
const mockedGet = api.get as jest.Mock

const planPayload = {
  id: 'p1',
  periodStart: '2026-09-21',
  periodEnd: '2026-09-27',
  status: 'ACTIVE',
  generatedAt: '2026-09-21T10:00:00Z',
  updatedAt: '2026-09-21T10:00:00Z',
  generationVersion: 1,
  summary: '3 priorities this week',
  items: [],
  completedCount: 0,
  activeCount: 3,
  deferredCount: 0,
  dismissedCount: 0,
  planVersion: 'action_plan_v1',
}

const itemPayload = {
  id: 'i1',
  planId: 'p1',
  title: 'Review Dining budget',
  status: 'PENDING',
  priority: 'HIGH',
  category: 'REVIEW_BUDGET',
  sourceType: 'RADAR',
  evidence: [],
  why: ['w'],
  actions: ['SIMULATE', 'COMPLETE'],
  score: 55,
  dismissedCount: 0,
  dataQuality: 'AVAILABLE',
  freshness: { status: 'FRESH' },
}

describe('ActionPlanService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('fetches the current plan', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: planPayload } })
    const plan = await getCurrentPlan()
    expect(mockedGet).toHaveBeenCalledWith('/v1/action-plan/current', {
      params: { refresh: false },
    })
    expect(plan.activeCount).toBe(3)
    expect(plan.planVersion).toBe('action_plan_v1')
  })

  it('passes the refresh flag through', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: planPayload } })
    await getCurrentPlan(true)
    expect(mockedGet).toHaveBeenCalledWith('/v1/action-plan/current', {
      params: { refresh: true },
    })
  })

  it('generates a fresh plan via POST', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: planPayload } })
    const plan = await generatePlan()
    expect(mockedPost).toHaveBeenCalledWith('/v1/action-plan/generate')
    expect(plan.id).toBe('p1')
  })

  it('lists plan history', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    const history = await getPlanHistory(0, 6)
    expect(mockedGet).toHaveBeenCalledWith('/v1/action-plan/history', {
      params: { skip: 0, limit: 6 },
    })
    expect(history).toEqual([])
  })

  it('runs the item lifecycle endpoints', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: { ...itemPayload, status: 'IN_PROGRESS' } } })
    const accepted = await acceptPlanItem('i1')
    expect(mockedPost).toHaveBeenCalledWith('/v1/action-plan/items/i1/accept')
    expect(accepted.status).toBe('IN_PROGRESS')

    mockedPost.mockResolvedValueOnce({ data: { data: { ...itemPayload, status: 'SNOOZED' } } })
    const snoozed = await snoozePlanItem('i1', 'TOMORROW')
    expect(mockedPost).toHaveBeenCalledWith('/v1/action-plan/items/i1/snooze', {
      option: 'TOMORROW',
    })
    expect(snoozed.status).toBe('SNOOZED')

    mockedPost.mockResolvedValueOnce({ data: { data: { ...itemPayload, status: 'COMPLETED' } } })
    const done = await completePlanItem('i1', 'exec-1')
    expect(mockedPost).toHaveBeenCalledWith('/v1/action-plan/items/i1/complete', {
      executionId: 'exec-1',
    })
    expect(done.status).toBe('COMPLETED')

    mockedPost.mockResolvedValueOnce({ data: { data: { ...itemPayload, status: 'DISMISSED' } } })
    const dismissed = await dismissPlanItem('i1')
    expect(dismissed.status).toBe('DISMISSED')
  })

  it('bridges a radar insight into the plan', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: itemPayload } })
    const item = await addInsightToPlan('ins-1')
    expect(mockedPost).toHaveBeenCalledWith(
      '/v1/action-plan/items/from-insight',
      { insightId: 'ins-1' },
    )
    expect(item.id).toBe('i1')
  })

  it('surfaces controlled backend errors', async () => {
    mockedPost.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'This plan item is already dismissed.', error_code: 'ITEM_ALREADY_DISMISSED' },
      },
    })
    await expect(dismissPlanItem('i1')).rejects.toMatchObject({
      message: 'This plan item is already dismissed.',
      code: 'ITEM_ALREADY_DISMISSED',
      status: 409,
    })
  })
})
