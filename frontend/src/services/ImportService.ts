import { api } from './api'
import type {
  CandidateDecision,
  ImportBatch,
  ImportPreview,
  ImportResult,
  ImportSummary,
} from '@/types/imports'

/**
 * Data-ingestion endpoints — upload / review / confirm / cancel.
 * The client never computes candidates or applies imports itself;
 * `confirmImport` is the only mutation boundary and requires the
 * token issued at preview time.
 */

const BASE = '/v1/imports'

export class ImportApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ImportApiError'
  }
}

function unwrapError(err: unknown): never {
  const e = err as {
    response?: {
      status?: number
      data?: {
        message?: string
        errorCode?: string
        error_code?: string
        details?: Record<string, unknown>
      }
    }
    message?: string
  }
  const message =
    e.response?.data?.message || e.message || 'The import could not be processed.'
  const code = e.response?.data?.errorCode || e.response?.data?.error_code
  throw new ImportApiError(message, code, e.response?.status, e.response?.data?.details)
}

/** Upload a document for extraction + review. Nothing is applied. */
export const uploadImport = async (file: {
  uri: string
  name: string
  mimeType?: string
  size?: number
}): Promise<ImportPreview> => {
  try {
    const form = new FormData()
    // React Native FormData file part — uri/name/type shape.
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as unknown as Blob)
    const response = await api.post(BASE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data?.data as ImportPreview
  } catch (err) {
    unwrapError(err)
  }
}

/** Import from pre-extracted document text (copilot path parity). */
export const ingestText = async (args: {
  fileName: string
  content: string
  mimeType?: string
}): Promise<ImportPreview> => {
  try {
    const response = await api.post(`${BASE}/from-text`, args)
    return response.data?.data as ImportPreview
  } catch (err) {
    unwrapError(err)
  }
}

/** Import history for the Import Center. */
export const listImports = async (
  skip = 0,
  limit = 50,
): Promise<ImportSummary[]> => {
  try {
    const response = await api.get(BASE, { params: { skip, limit } })
    return response.data?.data as ImportSummary[]
  } catch (err) {
    unwrapError(err)
  }
}

export const getImport = async (batchId: string): Promise<ImportBatch> => {
  try {
    const response = await api.get(`${BASE}/${batchId}`)
    return response.data?.data as ImportBatch
  } catch (err) {
    unwrapError(err)
  }
}

/** Full review payload — batch + candidates + detected fields. */
export const getImportPreview = async (
  batchId: string,
): Promise<ImportPreview> => {
  try {
    const response = await api.get(`${BASE}/${batchId}/preview`)
    return response.data?.data as ImportPreview
  } catch (err) {
    unwrapError(err)
  }
}

/** Review decision on one candidate — rotates the confirm token. */
export const decideCandidate = async (
  batchId: string,
  candidateId: string,
  args: { decision?: CandidateDecision; editedValue?: unknown },
) => {
  try {
    const response = await api.post(
      `${BASE}/${batchId}/candidates/${candidateId}`,
      args,
    )
    return response.data?.data
  } catch (err) {
    unwrapError(err)
  }
}

/**
 * Apply the import — requires the CURRENT confirm token from the
 * latest preview (any edit rotates it server-side).
 */
export const confirmImport = async (
  batchId: string,
  confirmToken: string,
): Promise<ImportResult> => {
  try {
    const response = await api.post(`${BASE}/${batchId}/confirm`, {
      confirmToken,
    })
    return response.data?.data as ImportResult
  } catch (err) {
    unwrapError(err)
  }
}

export const cancelImport = async (batchId: string): Promise<ImportBatch> => {
  try {
    const response = await api.post(`${BASE}/${batchId}/cancel`)
    return response.data?.data as ImportBatch
  } catch (err) {
    unwrapError(err)
  }
}

/** Post-apply result — what changed + what was recalculated. */
export const getImportChanges = async (
  batchId: string,
): Promise<ImportResult> => {
  try {
    const response = await api.get(`${BASE}/${batchId}/changes`)
    return response.data?.data as ImportResult
  } catch (err) {
    unwrapError(err)
  }
}
