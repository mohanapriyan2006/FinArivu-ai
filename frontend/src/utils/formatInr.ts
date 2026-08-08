export function formatInr(
  amount: number | undefined,
  { showSymbol = true, fallback = '' }: { showSymbol?: boolean; fallback?: string } = {}
): string {
  if (amount === undefined || isNaN(amount)) return fallback
  const formatted = amount.toLocaleString('en-IN')
  return showSymbol ? `₹${formatted}` : formatted
}

export function formatInrNumber(
  amount: number | undefined,
  fallback = ''
): string {
  if (amount === undefined || isNaN(amount)) return fallback
  return amount.toLocaleString('en-IN')
}

export function parseInrText(text: string): number | undefined {
  const digits = text.replace(/[^0-9]/g, '')
  if (digits === '') return undefined
  const value = Number(digits)
  if (isNaN(value)) return undefined
  return value
}
