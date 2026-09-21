import {
  formatEvidenceValue,
  freshnessLabel,
  groupInsights,
  sectionFor,
  severityLabel,
  severityRank,
  sortInsights,
} from '../moneyRadarUiState'
import type { RadarInsight } from '@/types/moneyRadar'

function makeInsight(overrides: Partial<RadarInsight>): RadarInsight {
  return {
    id: 'i1',
    insightType: 'BUDGET_RISK',
    status: 'ACTIVE',
    severity: 'LOW',
    title: 'Test',
    summary: 'summary',
    entityName: '',
    evidence: [],
    impact: { metricLabel: '', description: '' },
    explanation: [],
    actions: [],
    dataQuality: 'AVAILABLE',
    freshness: { status: 'FRESH' },
    detectorVersion: 'v1',
    updatedAt: '2026-09-21T10:00:00Z',
    ...overrides,
  }
}

describe('severityRank / sortInsights', () => {
  it('orders HIGH → MEDIUM → LOW → INFO', () => {
    const sorted = sortInsights([
      makeInsight({ id: 'a', severity: 'INFO' }),
      makeInsight({ id: 'b', severity: 'HIGH' }),
      makeInsight({ id: 'c', severity: 'LOW' }),
      makeInsight({ id: 'd', severity: 'MEDIUM' }),
    ])
    expect(sorted.map((i) => i.id)).toEqual(['b', 'd', 'c', 'a'])
  })

  it('breaks ties by newest first', () => {
    const sorted = sortInsights([
      makeInsight({ id: 'old', severity: 'LOW', updatedAt: '2026-09-01' }),
      makeInsight({ id: 'new', severity: 'LOW', updatedAt: '2026-09-20' }),
    ])
    expect(sorted.map((i) => i.id)).toEqual(['new', 'old'])
  })
})

describe('groupInsights', () => {
  it('groups by attention / opportunity / informational', () => {
    const grouped = groupInsights([
      makeInsight({ id: 'h', severity: 'HIGH' }),
      makeInsight({ id: 'm', severity: 'MEDIUM' }),
      makeInsight({
        id: 'opp',
        severity: 'LOW',
        insightType: 'DEBT_OPPORTUNITY',
      }),
      makeInsight({ id: 'i', severity: 'INFO', insightType: 'RECURRING_COST' }),
      makeInsight({ id: 'l', severity: 'LOW', insightType: 'BUDGET_RISK' }),
    ])
    expect(grouped.needsAttention.map((i) => i.id)).toEqual(['h', 'm'])
    expect(grouped.opportunities.map((i) => i.id)).toEqual(['opp'])
    // Global sort applies within sections too — LOW ranks before INFO.
    expect(grouped.informational.map((i) => i.id)).toEqual(['l', 'i'])
  })
})

describe('formatEvidenceValue', () => {
  it('formats currency with INR symbol', () => {
    expect(
      formatEvidenceValue({ key: 'x', label: 'x', value: 12000, unit: 'currency' }),
    ).toBe('₹12,000')
    expect(
      formatEvidenceValue({ key: 'x', label: 'x', value: 250000, unit: 'currency' }),
    ).toBe('₹2.5L')
  })

  it('formats percents and months', () => {
    expect(
      formatEvidenceValue({ key: 'x', label: 'x', value: 0.92, unit: 'percent' }),
    ).toBe('92%')
    expect(
      formatEvidenceValue({ key: 'x', label: 'x', value: 4, unit: 'months' }),
    ).toBe('4 mo')
  })

  it('handles missing/boolean/string values', () => {
    expect(formatEvidenceValue({ key: 'x', label: 'x' })).toBe('—')
    expect(formatEvidenceValue({ key: 'x', label: 'x', value: true })).toBe('Yes')
    expect(formatEvidenceValue({ key: 'x', label: 'x', value: 'abc' })).toBe('abc')
  })
})

describe('freshnessLabel / severityLabel / sectionFor', () => {
  it('renders freshness labels', () => {
    expect(freshnessLabel({ status: 'FRESH' })).toBe('Updated today')
    expect(freshnessLabel({ status: 'RECENT', ageDays: 3 })).toBe('Updated 3d ago')
    expect(freshnessLabel({ status: 'STALE', ageDays: 60 })).toBe('Data 60d old')
    expect(freshnessLabel({ status: 'UNKNOWN' })).toBe('')
  })

  it('renders severity labels', () => {
    expect(severityLabel('HIGH')).toBe('High priority')
    expect(severityLabel('INFO')).toBe('Info')
    expect(severityRank('HIGH')).toBe(0)
  })

  it('routes opportunity types to the opportunities section', () => {
    expect(
      sectionFor(makeInsight({ severity: 'LOW', insightType: 'TAX_OPPORTUNITY' })),
    ).toBe('opportunities')
    expect(sectionFor(makeInsight({ severity: 'HIGH' }))).toBe('needs_attention')
    expect(
      sectionFor(makeInsight({ severity: 'INFO', insightType: 'NETWORTH_CHANGE' })),
    ).toBe('informational')
  })
})
