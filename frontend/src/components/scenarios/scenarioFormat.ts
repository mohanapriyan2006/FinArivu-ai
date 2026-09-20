import type { MetricDirection, MetricUnit, ScenarioMetric } from '@/types/scenarios'

/** Format a metric value for display according to its unit. */
export function formatMetricValue(value: unknown, unit: MetricUnit): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number' || typeof value === 'string') {
    const num = typeof value === 'number' ? value : Number(value)
    switch (unit) {
      case 'currency': {
        if (!Number.isFinite(num)) return String(value)
        const abs = Math.abs(num)
        if (abs >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
        if (abs >= 100000) return `₹${(num / 100000).toFixed(1)} L`
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
      }
      case 'percent': {
        if (!Number.isFinite(num)) return String(value)
        // Rates arrive as fractions (0.10) or points (10) — normalise.
        const pct = Math.abs(num) <= 1 ? num * 100 : num
        return `${pct.toFixed(1)}%`
      }
      case 'months':
        if (!Number.isFinite(num)) return String(value)
        return `${Math.round(num)} mo`
      case 'count':
        return Number.isFinite(num) ? `${num}` : String(value)
      case 'date':
        return String(value)
      default:
        return String(value)
    }
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/** Format the signed change for a metric. */
export function formatMetricChange(metric: ScenarioMetric): string {
  const { change, unit } = metric
  if (change === null || change === undefined) return ''
  const num = typeof change === 'number' ? change : Number(change)
  if (!Number.isFinite(num) || num === 0) return ''
  const sign = num > 0 ? '+' : '−'
  return `${sign}${formatMetricValue(Math.abs(num), unit)}`
}

/** Colour semantics for a direction — IMPROVES is success, etc. */
export function directionTone(
  direction: MetricDirection,
): 'improve' | 'worsen' | 'neutral' {
  if (direction === 'IMPROVES') return 'improve'
  if (direction === 'WORSENS') return 'worsen'
  return 'neutral'
}

/** Arrow glyph for a direction. */
export function directionArrow(direction: MetricDirection): string {
  if (direction === 'IMPROVES') return '▲'
  if (direction === 'WORSENS') return '▼'
  return '■'
}
