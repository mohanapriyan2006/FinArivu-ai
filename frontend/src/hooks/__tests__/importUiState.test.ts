import {
  applicableCount,
  candidateStatusTone,
  confidenceTone,
  groupImportCandidates,
  importStatusTone,
} from '@/hooks/importUiState'
import type { ImportCandidate } from '@/types/imports'

const cand = (over: Partial<ImportCandidate>): ImportCandidate => ({
  id: 'c',
  batchId: 'b',
  kind: 'RECORD',
  targetDomain: 'expenses',
  targetEntity: 'transaction',
  operation: 'CREATE',
  label: 'x',
  validationState: 'VALID',
  confidence: 'HIGH',
  decision: 'ACCEPTED',
  ...over,
})

describe('importUiState', () => {
  it('maps import statuses to tones', () => {
    expect(importStatusTone('APPLIED')).toBe('success')
    expect(importStatusTone('FAILED')).toBe('danger')
    expect(importStatusTone('CANCELLED')).toBe('danger')
    expect(importStatusTone('REVIEW_REQUIRED')).toBe('warning')
    expect(importStatusTone('UPLOADED')).toBe('neutral')
  })

  it('maps candidate statuses and confidence to tones', () => {
    expect(candidateStatusTone('VALID')).toBe('success')
    expect(candidateStatusTone('INVALID')).toBe('danger')
    expect(candidateStatusTone('NEEDS_REVIEW')).toBe('warning')
    expect(candidateStatusTone('POSSIBLE_DUPLICATE')).toBe('warning')
    expect(candidateStatusTone('DUPLICATE')).toBe('neutral')
    expect(confidenceTone('HIGH')).toBe('success')
    expect(confidenceTone('LOW')).toBe('danger')
  })

  it('groups candidates into changes / review / skipped', () => {
    const groups = groupImportCandidates([
      cand({ id: 'a' }),
      cand({ id: 'b', decision: 'EDITED', editedValue: 10 }),
      cand({ id: 'c', decision: 'SKIPPED', validationState: 'NEEDS_REVIEW' }),
      cand({
        id: 'd',
        decision: 'SKIPPED',
        validationState: 'POSSIBLE_DUPLICATE',
      }),
      cand({ id: 'e', decision: 'SKIPPED', validationState: 'DUPLICATE' }),
      cand({ id: 'f', operation: 'SKIP', decision: 'SKIPPED' }),
    ])
    expect(groups.changes.map((c) => c.id)).toEqual(['a', 'b'])
    expect(groups.review.map((c) => c.id)).toEqual(['c', 'd'])
    expect(groups.skipped.map((c) => c.id)).toEqual(['e', 'f'])
  })

  it('counts only applicable candidates', () => {
    expect(
      applicableCount([
        cand({ id: 'a' }),
        cand({ id: 'b', decision: 'SKIPPED' }),
        cand({ id: 'c', operation: 'SKIP' }),
      ]),
    ).toBe(1)
  })
})
