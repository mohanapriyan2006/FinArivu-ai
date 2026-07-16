import { createStackNavigator } from '@react-navigation/stack'

import { useAuthContext } from '@/contexts/AuthContext'
import AuthNavigator from './AuthNavigator'
import MainTabNavigator from './MainTabNavigator'
import SplashScreen from '@/screens/onboarding/SplashScreen'
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen'
import FinancialHealthScreen from '@/screens/financialHealth/FinancialHealthScreen'
import QuickAddExpenseScreen from '@/screens/expenses/QuickAddExpenseScreen'
import BudgetAnalysisScreen from '@/screens/insights/BudgetAnalysisScreen'
import NetWorthScreen from '@/screens/insights/NetWorthScreen'
import TaxIntelligenceScreen from '@/screens/insights/TaxIntelligenceScreen'
import CreateGoalScreen from '@/screens/goals/CreateGoalScreen'
import GoalJourneyScreen from '@/screens/goals/GoalJourneyScreen'
import NotificationsScreen from '@/screens/notifications/NotificationsScreen'
import EditProfileScreen from '@/screens/profile/EditProfileScreen'

export type RootStackParamList = {
  Splash: undefined
  Onboarding: undefined
  Auth: undefined
  Main: undefined
  FinancialHealth: undefined
  BudgetAnalysis: undefined
  NetWorth: undefined
  TaxIntelligence: undefined
  CreateGoal: undefined
  GoalJourney: undefined
  Notifications: undefined
  EditProfile: undefined
  QuickAddExpense: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const { isAuthenticated } = useAuthContext()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="FinancialHealth" component={FinancialHealthScreen} />
          <Stack.Screen name="BudgetAnalysis" component={BudgetAnalysisScreen} />
          <Stack.Screen name="NetWorth" component={NetWorthScreen} />
          <Stack.Screen name="TaxIntelligence" component={TaxIntelligenceScreen} />
          <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
          <Stack.Screen name="GoalJourney" component={GoalJourneyScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen
            name="QuickAddExpense"
            component={QuickAddExpenseScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  )
}
