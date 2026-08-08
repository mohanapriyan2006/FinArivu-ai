import { formatInr, formatInrNumber, parseInrText } from '../formatInr'

describe('formatInr', () => {
  it('formats Indian rupee with symbol', () => {
    expect(formatInr(75000)).toBe('₹75,000')
    expect(formatInr(250000)).toBe('₹2,50,000')
    expect(formatInr(1250000)).toBe('₹12,50,000')
  })

  it('returns fallback for undefined', () => {
    expect(formatInr(undefined)).toBe('')
    expect(formatInr(undefined, { fallback: 'Not added' })).toBe('Not added')
  })

  it('can hide the rupee symbol', () => {
    expect(formatInr(75000, { showSymbol: false })).toBe('75,000')
  })

  it('parses formatted text into a number', () => {
    expect(parseInrText('₹75,000')).toBe(75000)
    expect(parseInrText('2,50,000')).toBe(250000)
    expect(parseInrText('')).toBeUndefined()
    expect(parseInrText('abc')).toBeUndefined()
  })

  it('formats numbers without symbol', () => {
    expect(formatInrNumber(100000)).toBe('1,00,000')
  })
})
