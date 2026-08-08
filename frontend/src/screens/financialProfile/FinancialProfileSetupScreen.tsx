import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RouteProp } from '@react-navigation/native'

import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import type { OnboardingStepId } from '@/types/financialProfile'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import { getStepById, getNextStepId, getPreviousStepId, ONBOARDING_STEPS } from '@/utils/onboardingSteps'
import { useTheme } from '@/contexts/ThemeContext'

import { AboutYouScreen } from './AboutYouScreen'
import { IncomeScreen } from './IncomeScreen'
import { ExpensesScreen } from './ExpensesScreen'
import { SavingsScreen } from './SavingsScreen'
import { InvestmentsScreen } from './InvestmentsScreen'
import { LoansScreen } from './LoansScreen'
import { GoalsScreen } from './GoalsScreen'
import { OptionalDetailsScreen } from './OptionalDetailsScreen'
import { FixedDepositsScreen } from './FixedDepositsScreen'
import { CreditCardsScreen } from './CreditCardsScreen'
import { InsuranceScreen } from './InsuranceScreen'
import { TaxDetailsScreen } from './TaxDetailsScreen'
import { ProfileCompletionScreen } from './ProfileCompletionScreen'

type FinancialProfileSetupNavigationProp = StackNavigationProp<RootStackParamList, 'FinancialProfileSetup'>
type FinancialProfileSetupRouteProp = RouteProp<RootStackParamList, 'FinancialProfileSetup'>

export interface StepScreenProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onExit: () => void
}

export default function FinancialProfileSetupScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<FinancialProfileSetupNavigationProp>()
  const route = useRoute<FinancialProfileSetupRouteProp>()
  const { resumeStep, exitSetup, loading, initialized } = useFinancialProfile()

  const startStep = (route.params?.startStep ?? resumeStep) as OnboardingStepId
  const [currentStepId, setCurrentStepId] = useState<OnboardingStepId>(startStep)

  useEffect(() => {
    setCurrentStepId(startStep)
  }, [startStep])

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStepId)
  const totalSteps = ONBOARDING_STEPS.length
  const step = getStepById(currentStepId)

  const goToNext = () => {
    const nextId = getNextStepId(currentStepId)
    if (nextId) {
      setCurrentStepId(nextId)
    } else {
      navigation.navigate('Main')
    }
  }

  const goToBack = () => {
    const prevId = getPreviousStepId(currentStepId)
    if (prevId) {
      setCurrentStepId(prevId)
    }
  }

  const handleExit = async () => {
    await exitSetup()
    navigation.navigate('Main')
  }

  const handleSkip = () => {
    goToNext()
  }

  const stepProps: StepScreenProps = {
    onNext: goToNext,
    onBack: goToBack,
    onSkip: handleSkip,
    onExit: handleExit,
  }

  const renderStep = () => {
    switch (currentStepId) {
      case 'aboutYou':
        return <AboutYouScreen {...stepProps} />
      case 'income':
        return <IncomeScreen {...stepProps} />
      case 'expenses':
        return <ExpensesScreen {...stepProps} />
      case 'savings':
        return <SavingsScreen {...stepProps} />
      case 'investments':
        return <InvestmentsScreen {...stepProps} />
      case 'loans':
        return <LoansScreen {...stepProps} />
      case 'goals':
        return <GoalsScreen {...stepProps} />
      case 'optionalDetails':
        return <OptionalDetailsScreen {...stepProps} goToStep={setCurrentStepId} />
      case 'fixedDeposits':
        return <FixedDepositsScreen {...stepProps} />
      case 'creditCards':
        return <CreditCardsScreen {...stepProps} />
      case 'insurance':
        return <InsuranceScreen {...stepProps} />
      case 'taxDetails':
        return <TaxDetailsScreen {...stepProps} />
      case 'completion':
        return <ProfileCompletionScreen {...stepProps} goToStep={setCurrentStepId} />
      default:
        return <AboutYouScreen {...stepProps} />
    }
  }

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
