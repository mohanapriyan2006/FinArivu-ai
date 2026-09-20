import {
  directionArrow,
  directionTone,
  formatMetricChange,
  formatMetricValue,
} from '../scenarioFormat'
import type { ScenarioMetric } from '@/types/scenarios'

describe('formatMetricValue', () => {
  it('formats currency compactly', () => {
    expect(formatMetricValue(150000, 'currency')).toBe('₹1.5 L')
    expect(formatMetricValue(12000000, 'currency')).toBe('₹1.20 Cr')
    expect(formatMetricValue(5000, 'currency')).toBe('₹5,000')
  })

  it('formats percent from fractions or points', () => {
    expect(formatMetricValue(0.1, 'percent')).toBe('10.0%')
    expect(formatMetricValue(10, 'percent')).toBe('10.0%')
  })

  it('formats months and dates', () => {
    expect(formatMetricValue(14.2, 'months')).toBe('14 mo')
    expect(formatMetricValue('2028-01-01', 'date')).toBe('2028-01-01')
  })

  it('handles null and non-numeric values', () => {
    expect(formatMetricValue(null, 'currency')).toBe('—')
    expect(formatMetricValue('abc', 'currency')).toBe('abc')
  })
})

describe('formatMetricChange', () => {
  const base: ScenarioMetric = {
    key: 'k',
    label: 'L',
    before: 100,
    after: 120,
    change: 20,
    unit: 'currency',
    direction: 'IMPROVES',
  }

  it('prefixes positive and negative changes', () => {
    expect(formatMetricChange(base)).toBe('+₹20')
    expect(formatMetricChange({ ...base, change: -20 })).toBe('−₹20')
  })

  it('returns empty for zero or missing change', () => {
    expect(formatMetricChange({ ...base, change: 0 })).toBe('')
    expect(formatMetricChange({ ...base, change: null })).toBe('')
  })
})

describe('direction helpers', () => {
  it('maps direction to tone and arrow', () => {
    expect(directionTone('IMPROVES')).toBe('improve')
    expect(directionTone('WORSENS')).toBe('worsen')
    expect(directionTone('UNCHANGED')).toBe('neutral')
    expect(directionArrow('IMPROVES')).toBe('▲')
    expect(directionArrow('WORSENS')).toBe('▼')
  })
})
