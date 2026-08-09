import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import { CompletionCard } from '@/components/financialProfile/CompletionCard'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import type { RootStackParamList } from '@/navigation/AppNavigator'

interface PulseProfileCompletionProps {
  percentage: number
  startStep?: string
  testID?: string
}

export function PulseProfileCompletion({
  percentage,
  startStep,
  testID,
}: PulseProfileCompletionProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { dismissPrompt, resumeStep } = useFinancialProfile()

  return (
    <CompletionCard
      percentage={percentage}
      onContinue={() =>
        navigation.navigate('FinancialProfileSetup', {
          startStep: startStep ?? resumeStep,
        })
      }
      onDismiss={dismissPrompt}
      testID={testID}
    />
  )
}
