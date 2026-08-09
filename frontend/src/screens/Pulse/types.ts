import type { LucideIcon } from 'lucide-react-native'
import type { OnboardingStepId } from '@/types/financialProfile'

export type PulseFinanceType =
  | 'expense'
  | 'budget'
  | 'savings'
  | 'investment'
  | 'goal'
  | 'loan'
  | 'credit_card'
  | 'insurance'
  | 'tax'

export type PulseFinanceStatus = 'normal' | 'warning' | 'attention' | 'empty'

export interface PulseFinanceItem {
  id: string
  type: PulseFinanceType
  title: string
  subtitle: string
  value?: string
  progress?: number
  progressColor?: string
  status: PulseFinanceStatus
  icon: LucideIcon
  iconColor: string
  iconBackground: string
  route?: string
  routeStep?: OnboardingStepId
  addRoute?: string
  emptyAction?: string
}

export interface PulseAttentionItem {
  id: string
  title: string
  message: string
  type: 'budget' | 'goal' | 'credit_card' | 'loan' | 'savings'
  routeStep: OnboardingStepId
  severity: 'warning' | 'danger'
}

export interface PulseRecentActivity {
  id: string
  title: string
  subtitle: string
  amount?: string
  dateLabel: string
  icon: LucideIcon
  iconColor: string
  iconBackground: string
}

export interface PulseQuickAction {
  id: string
  label: string
  icon: LucideIcon
  route: string
  params?: Record<string, unknown>
}

export interface PulseGoalMini {
  id: string
  name: string
  current: number
  target: number
  progress: number
  targetYear: number
}

export interface PulseState {
  isNewUser: boolean
  finances: PulseFinanceItem[]
  attention: PulseAttentionItem[]
  goals: PulseGoalMini[]
  recentActivity: PulseRecentActivity[]
  profileComplete: boolean
  profileCompletionPercentage: number
  lastIncompleteStep: OnboardingStepId | null
}
