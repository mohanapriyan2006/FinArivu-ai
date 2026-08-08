import { useMemo, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  Car,
  GraduationCap,
  HelpCircle,
  Home,
  Plane,
  Shield,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { FinancialCategoryGrid } from '@/components/financialProfile/FinancialCategoryGrid'
import { GoalCard } from '@/components/financialProfile/GoalCard'
import type { Goal, GoalProfile, GoalType } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const GOAL_CATEGORIES = [
  { id: 'home' as GoalType, icon: Home, label: 'Home' },
  { id: 'vehicle' as GoalType, icon: Car, label: 'Vehicle' },
  { id: 'education' as GoalType, icon: GraduationCap, label: 'Education' },
  { id: 'travel' as GoalType, icon: Plane, label: 'Travel' },
  { id: 'emergency' as GoalType, icon: Shield, label: 'Emergency' },
  { id: 'retirement' as GoalType, icon: Wallet, label: 'Retirement' },
  { id: 'marriage' as GoalType, icon: Users, label: 'Marriage' },
  { id: 'wealth' as GoalType, icon: TrendingUp, label: 'Wealth' },
  { id: 'other' as GoalType, icon: HelpCircle, label: 'Other' },
]

const GOAL_LABELS: Record<GoalType, string> = {
  home: 'Home',
  vehicle: 'Vehicle',
  education: 'Education',
  travel: 'Travel',
  emergency: 'Emergency Fund',
  retirement: 'Retirement',
  marriage: 'Marriage',
  wealth: 'Wealth',
  other: 'Other',
}

function createGoal(type: GoalType): Goal {
  const label = GOAL_LABELS[type]
  return {
    id: `${type}-${Date.now()}`,
    type,
    name: `${label} Goal`,
    targetAmount: 0,
    targetYear: new Date().getFullYear() + 5,
  }
}

export function GoalsScreen({ onNext, onBack, onSkip, onExit }: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.goals

  const [selectedTypes, setSelectedTypes] = useState<GoalType[]>(
    existing?.goals.map((g) => g.type) ?? []
  )
  const [goals, setGoals] = useState<Goal[]>(existing?.goals ?? [])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hint: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          marginBottom: 16,
        },
      }),
    [colors]
  )

  const toggleGoal = (id: string) => {
    const type = id as GoalType
    if (selectedTypes.includes(type)) {
      setSelectedTypes((prev) => prev.filter((t) => t !== type))
      setGoals((prev) => prev.filter((g) => g.type !== type))
    } else {
      setSelectedTypes((prev) => [...prev, type])
      setGoals((prev) => [...prev, createGoal(type)])
    }
  }

  const updateGoal = (id: string, goal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)))
  }

  const removeGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
    if (goal) {
      setSelectedTypes((prev) => prev.filter((t) => t !== goal.type))
    }
  }

  const canContinue = goals.length === 0 || goals.every((g) => g.name.length > 0 && g.targetAmount > 0)

  const handleContinue = async () => {
    if (!canContinue) return
    const data: GoalProfile = { goals }
    await saveSection({ section: 'goals', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={6}
      totalSteps={13}
      stepTitle="Goals"
      title="What are you planning for?"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <Text style={styles.hint}>Select the goals you are saving towards. You can skip this step if you prefer.</Text>
      <FinancialCategoryGrid
        categories={GOAL_CATEGORIES}
        selectedIds={selectedTypes}
        onToggle={toggleGoal}
        columns={3}
        testID="goals-grid"
      />

      {goals.map((goal, index) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onChange={(updated) => updateGoal(goal.id, updated)}
          onDelete={() => removeGoal(goal.id)}
          typeLabel={GOAL_LABELS[goal.type]}
          testID={`goal-card-${index}`}
        />
      ))}
    </FinancialProfileStepper>
  )
}
