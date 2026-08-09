import { createStackNavigator } from '@react-navigation/stack'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import AuthNavigator from './AuthNavigator'
import MainTabNavigator from './MainTabNavigator'
import SplashScreen from '@/screens/onboarding/SplashScreen'
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen'
import QuickAddExpenseScreen from '@/screens/expenses/QuickAddExpenseScreen'
import CreateGoalScreen from '@/screens/Pulse/CreateGoalScreen'
import ExpenseTrackerScreen from '@/screens/Pulse/screens/ExpenseTrackerScreen'
import BudgetTrackerScreen from '@/screens/Pulse/screens/BudgetTrackerScreen'
import SavingsTrackerScreen from '@/screens/Pulse/screens/SavingsTrackerScreen'
import InvestmentTrackerScreen from '@/screens/Pulse/screens/InvestmentTrackerScreen'
import GoalsTrackerScreen from '@/screens/Pulse/screens/GoalsTrackerScreen'
import LoanTrackerScreen from '@/screens/Pulse/screens/LoanTrackerScreen'
import CreditCardTrackerScreen from '@/screens/Pulse/screens/CreditCardTrackerScreen'
import InsuranceTrackerScreen from '@/screens/Pulse/screens/InsuranceTrackerScreen'
import AddInvestmentScreen from '@/screens/Pulse/screens/AddInvestmentScreen'
import NotificationsScreen from '@/screens/notifications/NotificationsScreen'
import WeeklyReportStoryScreen from '@/screens/reports/WeeklyReportStoryScreen'
import FinancialProfileSetupScreen from '@/screens/financialProfile/FinancialProfileSetupScreen'
import FinancialHealthPlaceholderScreen from '@/screens/insights/FinancialHealthPlaceholderScreen'

export type RootStackParamList = {
  Splash: undefined
  Onboarding: undefined
  Auth: undefined
  Main: undefined
  FinancialProfileSetup: { startStep?: string } | undefined
  CreateGoal: undefined
  Notifications: undefined
  QuickAddExpense: undefined
  WeeklyReport: undefined
  ExpenseTracker: undefined
  BudgetTracker: undefined
  SavingsTracker: undefined
  InvestmentTracker: undefined
  GoalsTracker: undefined
  LoanTracker: undefined
  CreditCardTracker: undefined
  InsuranceTracker: undefined
  AddInvestment: undefined
  FinancialHealth: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const { isAuthenticated } = useAuthContext()
  const { loading, initialized } = useFinancialProfile()

  const initialRouteName = !isAuthenticated
    ? 'Splash'
    : initialized
    ? 'Main'
    : 'FinancialProfileSetup'

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#5B4EFA" />
      </View>
    )
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      {!isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="FinancialProfileSetup" component={FinancialProfileSetupScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
          <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
          <Stack.Screen name="BudgetTracker" component={BudgetTrackerScreen} />
          <Stack.Screen name="SavingsTracker" component={SavingsTrackerScreen} />
          <Stack.Screen name="InvestmentTracker" component={InvestmentTrackerScreen} />
          <Stack.Screen name="GoalsTracker" component={GoalsTrackerScreen} />
          <Stack.Screen name="LoanTracker" component={LoanTrackerScreen} />
          <Stack.Screen name="CreditCardTracker" component={CreditCardTrackerScreen} />
          <Stack.Screen name="InsuranceTracker" component={InsuranceTrackerScreen} />
          <Stack.Screen name="AddInvestment" component={AddInvestmentScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen
            name="QuickAddExpense"
            component={QuickAddExpenseScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="WeeklyReport" component={WeeklyReportStoryScreen} />
          <Stack.Screen name="FinancialHealth" component={FinancialHealthPlaceholderScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFF',
  },
})
