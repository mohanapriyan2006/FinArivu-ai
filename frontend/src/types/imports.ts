/**
 * Financial Data Ingestion contract types (Phase 5).
 *
 * Mirrors `backend/app/data_ingestion/schemas.py` — camelCase on the
 * wire. The client is a dumb renderer: extraction, validation, dedup
 * and commit all happen server-side; nothing here mutates financial
 * data except the explicit `confirm` call carrying the preview token.
 */

export type ImportDocumentType =
  | 'PAYSLIP'
  | 'BANK_STATEMENT'
  | 'LOAN_STATEMENT'
  | 'INVESTMENT_STATEMENT'

export type ImportStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'REVIEW_REQUIRED'
  | 'CONFIRMED'
  | 'APPLIED'
  | 'PARTIALLY_APPLIED'
  | 'FAILED'
  | 'CANCELLED'

export type CandidateKind = 'FIELD' | 'ENTITY' | 'RECORD'

export type CandidateOperation = 'UPDATE' | 'CREATE' | 'SKIP'

export type CandidateStatus =
  | 'VALID'
  | 'WARNING'
  | 'INVALID'
  | 'DUPLICATE'
  | 'POSSIBLE_DUPLICATE'
  | 'NEEDS_REVIEW'

export type CandidateDecision = 'ACCEPTED' | 'EDITED' | 'SKIPPED'

export type ImportConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ImportProvenance {
  sourceType?: string
  sourceLabel?: string
  sourcePage?: number | null
  sourceRow?: number | null
  sourceColumn?: string | null
}

export interface ImportCandidate {
  id: string
  batchId: string
  kind: CandidateKind
  targetDomain: string
  targetEntity: string
  operation: CandidateOperation
  fieldName?: string | null
  label: string
  currentValue?: unknown
  proposedValue?: unknown
  proposedPayload?: Record<string, unknown>
  editedValue?: unknown
  matchedEntityId?: string | null
  validationState: CandidateStatus
  confidence: ImportConfidence
  decision: CandidateDecision
  fingerprint?: string | null
  provenance?: ImportProvenance
  warnings?: string[]
  seq?: number
  appliedAt?: string | null
  appliedEntityId?: string | null
}

export interface ImportBatch {
  id: string
  documentType: ImportDocumentType
  sourceName: string
  fileName: string
  status: ImportStatus
  periodStart?: string | null
  periodEnd?: string | null
  confirmToken: string
  summary: {
    counts?: ImportCounts
    warnings?: string[]
    detectedFields?: DetectedField[]
    meta?: Record<string, unknown>
  }
  result?: Record<string, unknown>
  errorCode?: string | null
  dataQuality?: string
  createdAt?: string | null
  extractedAt?: string | null
  confirmedAt?: string | null
  appliedAt?: string | null
  cancelledAt?: string | null
}

export interface ImportCounts {
  fields?: number
  records?: number
  changes?: number
  warnings?: number
  duplicates?: number
  needsReview?: number
  invalid?: number
}

export interface DetectedField {
  key: string
  label: string
  value: unknown
  confidence: ImportConfidence
  provenance?: ImportProvenance
}

export interface ImportSummary {
  id: string
  documentType: ImportDocumentType
  fileName: string
  status: ImportStatus
  periodStart?: string | null
  periodEnd?: string | null
  summary: { counts?: ImportCounts }
  createdAt?: string | null
  appliedAt?: string | null
}

export interface ImportPreview {
  batch: ImportBatch
  candidates: ImportCandidate[]
  detectedFields: DetectedField[]
  counts: ImportCounts
}

export interface ImportResult {
  batchId: string
  status: ImportStatus
  appliedCounts: Record<string, number>
  skippedCounts: Record<string, number>
  warningCounts: Record<string, number>
  changedDomains: string[]
  recalculated: string[]
  radarRefreshed: boolean
  planReconciled: boolean
  appliedAt?: string | null
}

/** Compact import card carried on the copilot response. */
export interface ImportPreviewCard {
  batchId?: string
  documentType?: ImportDocumentType | string
  fileName?: string
  status?: string
  counts?: ImportCounts
}
