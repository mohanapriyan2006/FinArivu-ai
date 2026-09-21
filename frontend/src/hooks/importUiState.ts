import type {
  CandidateStatus,
  ImportCandidate,
  ImportConfidence,
  ImportDocumentType,
  ImportStatus,
} from '@/types/imports'

/**
 * Pure UI-state helpers for the import screens — no side effects.
 */

export const DOC_TYPE_LABELS: Record<ImportDocumentType, string> = {
  PAYSLIP: 'Payslip',
  BANK_STATEMENT: 'Bank statement',
  LOAN_STATEMENT: 'Loan statement',
  INVESTMENT_STATEMENT: 'Investment statement',
}

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  REVIEW_REQUIRED: 'Review',
  CONFIRMED: 'Confirmed',
  APPLIED: 'Applied',
  PARTIALLY_APPLIED: 'Partially applied',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

export type ImportStatusTone = 'success' | 'warning' | 'danger' | 'neutral'

export function importStatusTone(status: ImportStatus): ImportStatusTone {
  if (status === 'APPLIED') return 'success'
  if (status === 'FAILED' || status === 'CANCELLED') return 'danger'
  if (status === 'REVIEW_REQUIRED' || status === 'PARTIALLY_APPLIED') {
    return 'warning'
  }
  return 'neutral'
}

export type CandidateTone = 'success' | 'warning' | 'danger' | 'neutral'

export function candidateStatusTone(status: CandidateStatus): CandidateTone {
  switch (status) {
    case 'VALID':
      return 'success'
    case 'INVALID':
      return 'danger'
    case 'WARNING':
    case 'POSSIBLE_DUPLICATE':
    case 'NEEDS_REVIEW':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function confidenceTone(confidence: ImportConfidence): CandidateTone {
  switch (confidence) {
    case 'HIGH':
      return 'success'
    case 'MEDIUM':
      return 'warning'
    default:
      return 'danger'
  }
}

export interface CandidateGroups {
  /** Accepted (or edited) candidates that will be applied on confirm. */
  changes: ImportCandidate[]
  /** Duplicates / ambiguous / invalid rows parked for a user decision. */
  review: ImportCandidate[]
  /** Everything else the user or pipeline already skipped. */
  skipped: ImportCandidate[]
}

const DECISION_PENDING_STATUSES: CandidateStatus[] = [
  'NEEDS_REVIEW',
  'POSSIBLE_DUPLICATE',
  'INVALID',
]

export function groupImportCandidates(
  candidates: ImportCandidate[],
): CandidateGroups {
  const groups: CandidateGroups = { changes: [], review: [], skipped: [] }
  for (const c of candidates) {
    if (c.decision !== 'SKIPPED' && c.operation !== 'SKIP') {
      groups.changes.push(c)
    } else if (
      DECISION_PENDING_STATUSES.includes(c.validationState) &&
      c.operation !== 'SKIP'
    ) {
      groups.review.push(c)
    } else {
      groups.skipped.push(c)
    }
  }
  return groups
}

/** Candidates that will actually be applied — for the confirm button. */
export function applicableCount(candidates: ImportCandidate[]): number {
  return candidates.filter(
    (c) => c.decision !== 'SKIPPED' && c.operation !== 'SKIP',
  ).length
}
