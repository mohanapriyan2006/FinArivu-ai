import {
  actionRequestFromPayload,
  cancelAction,
  executeAction,
  getActionHistory,
  previewAction,
  undoAction,
} from '../ActionService'

jest.mock('../api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

import { api } from '../api'

const mockedPost = api.post as jest.Mock
const mockedGet = api.get as jest.Mock

describe('ActionService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('posts a typed preview request and returns the preview', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          executionId: 'exec-1',
          status: 'AWAITING_CONFIRMATION',
          operation: 'UPDATE_BUDGET',
          title: 'Update Food budget',
          entityName: 'Food',
          before: { monthlyLimit: 12000 },
          after: { monthlyLimit: 8000 },
          impact: { monthlyBudgetChange: -4000 },
          affectedAreas: ['budgets'],
          requiresConfirmation: true,
        },
      },
    })

    const preview = await previewAction({
      operation: 'UPDATE_BUDGET',
      arguments: { categoryName: 'Food', monthlyLimit: 8000 },
      sessionId: 's1',
    })

    expect(mockedPost).toHaveBeenCalledWith('/v1/copilot/actions/preview', {
      operation: 'UPDATE_BUDGET',
      arguments: { categoryName: 'Food', monthlyLimit: 8000 },
      session_id: 's1',
    })
    expect(preview.status).toBe('AWAITING_CONFIRMATION')
    expect(preview.executionId).toBe('exec-1')
  })

  it('executes with confirmation=true and session_id', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { executionId: 'e1', status: 'EXECUTED' } },
    })
    await executeAction('e1', 'sess-1')
    expect(mockedPost).toHaveBeenCalledWith('/v1/copilot/actions/execute', {
      execution_id: 'e1',
      confirmation: true,
      session_id: 'sess-1',
    })
  })

  it('cancels a pending preview', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { executionId: 'e1', status: 'CANCELLED' } },
    })
    const result = await cancelAction('e1')
    expect(mockedPost).toHaveBeenCalledWith('/v1/copilot/actions/e1/cancel')
    expect(result.status).toBe('CANCELLED')
  })

  it('undoes an executed action', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { executionId: 'e1', status: 'UNDONE' } },
    })
    const result = await undoAction('e1')
    expect(mockedPost).toHaveBeenCalledWith('/v1/copilot/actions/e1/undo')
    expect(result.status).toBe('UNDONE')
  })

  it('loads action history', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [{ id: 'h1' }] } })
    const items = await getActionHistory(10, 5)
    expect(mockedGet).toHaveBeenCalledWith('/v1/copilot/actions/history', {
      params: { limit: 10, offset: 5 },
    })
    expect(items).toHaveLength(1)
  })

  it('surfaces controlled backend errors', async () => {
    mockedPost.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'This preview is out of date.', error_code: 'STALE_PREVIEW' },
      },
    })
    await expect(executeAction('e1')).rejects.toMatchObject({
      message: 'This preview is out of date.',
      code: 'STALE_PREVIEW',
      status: 409,
    })
  })

  it('builds a preview request from a valid API_ACTION payload', () => {
    const request = actionRequestFromPayload(
      { operation: 'UPDATE_BUDGET', arguments: { categoryName: 'Food' } },
      's1',
    )
    expect(request).toEqual({
      operation: 'UPDATE_BUDGET',
      arguments: { categoryName: 'Food' },
      sessionId: 's1',
    })
  })

  it('rejects malformed API_ACTION payloads', () => {
    expect(actionRequestFromPayload(undefined)).toBeNull()
    expect(actionRequestFromPayload({})).toBeNull()
    expect(actionRequestFromPayload({ operation: 'X' })).toBeNull()
    expect(
      actionRequestFromPayload({ operation: 'X', arguments: 'nope' }),
    ).toBeNull()
  })
})
