import {
  cancelImport,
  confirmImport,
  decideCandidate,
  getImportChanges,
  getImportPreview,
  ingestText,
  listImports,
  uploadImport,
} from '../ImportService'

jest.mock('../api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

import { api } from '../api'

const mockedPost = api.post as jest.Mock
const mockedGet = api.get as jest.Mock

const previewPayload = {
  batch: {
    id: 'b1',
    documentType: 'BANK_STATEMENT',
    sourceName: 'upload',
    fileName: 'stmt.csv',
    status: 'REVIEW_REQUIRED',
    confirmToken: 'tok123',
    summary: { counts: { changes: 3, duplicates: 1 } },
  },
  candidates: [],
  detectedFields: [],
  counts: { changes: 3, duplicates: 1 },
}

describe('ImportService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('uploads a document as multipart form data', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: previewPayload } })
    const preview = await uploadImport({
      uri: 'file:///stmt.csv',
      name: 'stmt.csv',
      mimeType: 'text/csv',
    })
    expect(mockedPost).toHaveBeenCalledWith(
      '/v1/imports',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    expect(preview.batch.confirmToken).toBe('tok123')
  })

  it('ingests pre-extracted text via the copilot path', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: previewPayload } })
    await ingestText({ fileName: 'stmt.csv', content: 'Date,Amount\n1,2' })
    expect(mockedPost).toHaveBeenCalledWith('/v1/imports/from-text', {
      fileName: 'stmt.csv',
      content: 'Date,Amount\n1,2',
    })
  })

  it('lists import history with pagination params', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    await listImports(10, 20)
    expect(mockedGet).toHaveBeenCalledWith('/v1/imports', {
      params: { skip: 10, limit: 20 },
    })
  })

  it('fetches the review preview for a batch', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: previewPayload } })
    const preview = await getImportPreview('b1')
    expect(mockedGet).toHaveBeenCalledWith('/v1/imports/b1/preview')
    expect(preview.counts.changes).toBe(3)
  })

  it('sends a candidate decision with an edited value', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: { id: 'c1' } } })
    await decideCandidate('b1', 'c1', {
      decision: 'EDITED',
      editedValue: 95000,
    })
    expect(mockedPost).toHaveBeenCalledWith(
      '/v1/imports/b1/candidates/c1',
      { decision: 'EDITED', editedValue: 95000 },
    )
  })

  it('confirms with the preview token', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { batchId: 'b1', status: 'APPLIED' } },
    })
    const result = await confirmImport('b1', 'tok123')
    expect(mockedPost).toHaveBeenCalledWith('/v1/imports/b1/confirm', {
      confirmToken: 'tok123',
    })
    expect(result.status).toBe('APPLIED')
  })

  it('cancels a pending import', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { ...previewPayload.batch, status: 'CANCELLED' } },
    })
    const batch = await cancelImport('b1')
    expect(mockedPost).toHaveBeenCalledWith('/v1/imports/b1/cancel')
    expect(batch.status).toBe('CANCELLED')
  })

  it('fetches the applied changes summary', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: { batchId: 'b1', status: 'APPLIED' } },
    })
    const result = await getImportChanges('b1')
    expect(mockedGet).toHaveBeenCalledWith('/v1/imports/b1/changes')
    expect(result.status).toBe('APPLIED')
  })

  it('surfaces controlled backend errors with code + details', async () => {
    mockedPost.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          message: 'This document appears to have already been imported.',
          error_code: 'DUPLICATE_IMPORT',
          details: { existingBatchId: 'b0' },
        },
      },
    })
    await expect(
      ingestText({ fileName: 'x.csv', content: 'a,b' }),
    ).rejects.toMatchObject({
      message: 'This document appears to have already been imported.',
      code: 'DUPLICATE_IMPORT',
      status: 409,
      details: { existingBatchId: 'b0' },
    })
  })
})
