import { createStackNavigator } from '@react-navigation/stack'

import { useAuthContext } from '@/contexts/AuthContext'
import AuthNavigator from './AuthNavigator'
import MainTabNavigator from './MainTabNavigator'
import SplashScreen from '@/screens/onboarding/SplashScreen'
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen'
import FinancialHealthScreen from '@/screens/financialHealth/FinancialHealthScreen'
import QuickAddExpenseScreen from '@/screens/expenses/QuickAddExpenseScreen'

const Stack = createStackNavigator()

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
