/**
 * Pure UI-state helpers for the Money Radar surface.
 *
 * Grouping, ordering and label mapping live here — components stay
 * presentation-only and this module is unit-testable without React.
 */

import type {
  DataFreshness,
  EvidenceItem,
  InsightSeverity,
  RadarInsight,
} from '@/types/moneyRadar'

export type RadarSection = 'needs_attention' | 'opportunities' | 'informational'

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  INFO: 3,
}

const OPPORTUNITY_TYPES = new Set([
  'DEBT_OPPORTUNITY',
  'TAX_OPPORTUNITY',
])

export function severityRank(severity: InsightSeverity): number {
  return SEVERITY_RANK[severity] ?? 4
}

/** Sort: severity first, then newest. Pure. */
export function sortInsights(insights: RadarInsight[]): RadarInsight[] {
  return [...insights].sort((a, b) => {
    const bySeverity = severityRank(a.severity) - severityRank(b.severity)
    if (bySeverity !== 0) return bySeverity
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
  })
}

/** Bucket an insight into its display section. */
export function sectionFor(insight: RadarInsight): RadarSection {
  if (OPPORTUNITY_TYPES.has(insight.insightType)) return 'opportunities'
  if (insight.severity === 'HIGH' || insight.severity === 'MEDIUM') {
    return 'needs_attention'
  }
  return 'informational'
}

export interface GroupedInsights {
  needsAttention: RadarInsight[]
  opportunities: RadarInsight[]
  informational: RadarInsight[]
}

export function groupInsights(insights: RadarInsight[]): GroupedInsights {
  const sorted = sortInsights(insights)
  const grouped: GroupedInsights = {
    needsAttention: [],
    opportunities: [],
    informational: [],
  }
  for (const insight of sorted) {
    switch (sectionFor(insight)) {
      case 'needs_attention':
        grouped.needsAttention.push(insight)
        break
      case 'opportunities':
        grouped.opportunities.push(insight)
        break
      default:
        grouped.informational.push(insight)
    }
  }
  return grouped
}

/** Human label for an evidence value — INR-aware, unit-aware. */
export function formatEvidenceValue(item: EvidenceItem): string {
  const v = item.value
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'string') return v
  if (typeof v !== 'number' || Number.isNaN(v)) return String(v)

  switch (item.unit) {
    case 'currency':
      return `₹${Math.abs(v) >= 100000 ? (v / 100000).toFixed(1) + 'L' : v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    case 'percent':
      return `${Math.abs(v) <= 1 ? (v * 100).toFixed(0) : v.toFixed(1)}%`
    case 'months':
      return `${Math.round(v)} mo`
    default:
      return v.toLocaleString('en-IN', { maximumFractionDigits: 1 })
  }
}

/** Short freshness label for card footers. */
export function freshnessLabel(freshness: DataFreshness): string {
  switch (freshness.status) {
    case 'FRESH':
      return 'Updated today'
    case 'RECENT':
      return freshness.ageDays != null
        ? `Updated ${freshness.ageDays}d ago`
        : 'Updated recently'
    case 'STALE':
      return freshness.ageDays != null
        ? `Data ${freshness.ageDays}d old`
        : 'Stale data'
    default:
      return ''
  }
}

/** Accessibility/text label for severity chips. */
export function severityLabel(severity: InsightSeverity): string {
  switch (severity) {
    case 'HIGH':
      return 'High priority'
    case 'MEDIUM':
      return 'Medium priority'
    case 'LOW':
      return 'Low priority'
    default:
      return 'Info'
  }
}
