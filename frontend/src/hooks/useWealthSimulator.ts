import { useMemo, useState } from 'react'

import {
  calculateWealthProjection,
  type WealthProjection,
} from '@/utils/wealthSimulatorEngine'

export type ScenarioKey = 'low' | 'mid' | 'high'

export interface SimulatorParam {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  format: (value: number) => string
}

const SCENARIO_RATES: Record<ScenarioKey, number> = {
  low: 0.08,
  mid: 0.12,
  high: 0.15,
}

export function useWealthSimulator() {
  const [monthlySavings, setMonthlySavings] = useState(25000)
  const [annualHike, setAnnualHike] = useState(10)
  const [inflation, setInflation] = useState(6)
  const [years, setYears] = useState(20)
  const [scenario, setScenario] = useState<ScenarioKey>('mid')

  const params = useMemo(
    () => ({
      monthlySavings,
      annualHike: annualHike / 100,
      inflation: inflation / 100,
      years,
      scenarioRate: SCENARIO_RATES[scenario],
    }),
    [monthlySavings, annualHike, inflation, years, scenario]
  )

  const projection: WealthProjection = useMemo(
    () => calculateWealthProjection(params),
    [params]
  )

  const formatCurrency = (value: number): string => {
    if (value >= 1_00_00_000) {
      return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
    }
    if (value >= 1_00_000) {
      return `₹${(value / 1_00_000).toFixed(1)} L`
    }
    return `₹${Math.round(value).toLocaleString('en-IN')}`
  }

  const sliders: SimulatorParam[] = useMemo(
    () => [
      {
        label: 'Monthly Savings',
        value: monthlySavings,
        min: 5000,
        max: 100000,
        step: 500,
        unit: '₹',
        format: (v) => `₹${v.toLocaleString('en-IN')}`,
      },
      {
        label: 'Annual Income Hike',
        value: annualHike,
        min: 0,
        max: 30,
        step: 1,
        unit: '%',
        format: (v) => `${v}%`,
      },
      {
        label: 'Expected Inflation',
        value: inflation,
        min: 0,
        max: 15,
        step: 0.5,
        unit: '%',
        format: (v) => `${v}%`,
      },
      {
        label: 'Years to Goal',
        value: years,
        min: 1,
        max: 40,
        step: 1,
        unit: 'Yr',
        format: (v) => `${v} Years`,
      },
    ],
    [monthlySavings, annualHike, inflation, years]
  )

  const scenarioCards = useMemo(
    () => [
      { key: 'low' as ScenarioKey, label: 'Low', rate: '8%' },
      { key: 'mid' as ScenarioKey, label: 'Mid', rate: '12%' },
      { key: 'high' as ScenarioKey, label: 'High', rate: '15%' },
    ],
    []
  )

  return {
    monthlySavings,
    setMonthlySavings,
    annualHike,
    setAnnualHike,
    inflation,
    setInflation,
    years,
    setYears,
    scenario,
    setScenario,
    scenarioRate: SCENARIO_RATES[scenario],
    projection,
    sliders,
    scenarioCards,
    formatCurrency,
  }
}
