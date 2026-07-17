export interface WealthParams {
  monthlySavings: number
  annualHike: number
  inflation: number
  years: number
  scenarioRate: number
}

export interface WealthProjection {
  projectedNetWorth: number
  totalPrincipal: number
  estimatedReturns: number
  inflationImpact: number
}

function futureValueGrowingAnnuity(
  firstContribution: number,
  years: number,
  returnRate: number,
  growthRate: number
): number {
  if (years <= 0) return 0

  const r = returnRate
  const g = growthRate

  if (Math.abs(r - g) < 1e-9) {
    return firstContribution * years * Math.pow(1 + r, years - 1)
  }

  const rFactor = Math.pow(1 + r, years)
  const gFactor = Math.pow(1 + g, years)

  return firstContribution * ((rFactor - gFactor) / (r - g))
}

function totalGrowingContributions(
  firstContribution: number,
  years: number,
  growthRate: number
): number {
  if (years <= 0) return 0

  if (Math.abs(growthRate) < 1e-9) {
    return firstContribution * years
  }

  const gFactor = Math.pow(1 + growthRate, years)
  return firstContribution * ((gFactor - 1) / growthRate)
}

export function calculateWealthProjection({
  monthlySavings,
  annualHike,
  inflation,
  years,
  scenarioRate,
}: WealthParams): WealthProjection {
  const annualSavings = monthlySavings * 12
  const nominalFutureValue = futureValueGrowingAnnuity(
    annualSavings,
    years,
    scenarioRate,
    annualHike
  )
  const totalPrincipal = totalGrowingContributions(annualSavings, years, annualHike)
  const estimatedReturns = nominalFutureValue - totalPrincipal
  const inflationDiscount = Math.pow(1 + inflation, years)
  const projectedNetWorth = nominalFutureValue / inflationDiscount
  const inflationImpact = projectedNetWorth - nominalFutureValue

  return {
    projectedNetWorth,
    totalPrincipal,
    estimatedReturns,
    inflationImpact,
  }
}

export function formatCompactIndianRupee(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs >= 1_00_00_000) {
    return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`
  }

  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(1)} L`
  }

  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`
}
