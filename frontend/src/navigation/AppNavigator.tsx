import { createStackNavigator } from '@react-navigation/stack'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import AuthNavigator from './AuthNavigator'
import MainTabNavigator from './MainTabNavigator'
import SplashScreen from '@/screens/onboarding/SplashScreen'
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen'
import QuickAddExpenseScreen from '@/screens/expenses/QuickAddExpenseScreen'
import CreateGoalScreen from '@/screens/goals/CreateGoalScreen'
import NotificationsScreen from '@/screens/notifications/NotificationsScreen'
import EditProfileScreen from '@/screens/profile/EditProfileScreen'
import WeeklyReportStoryScreen from '@/screens/reports/WeeklyReportStoryScreen'
import FinancialProfileSetupScreen from '@/screens/financialProfile/FinancialProfileSetupScreen'

export type RootStackParamList = {
  Splash: undefined
  Onboarding: undefined
  Auth: undefined
  Main: undefined
  FinancialProfileSetup: { startStep?: string } | undefined
  CreateGoal: undefined
  Notifications: undefined
  EditProfile: undefined
  QuickAddExpense: undefined
  WeeklyReport: undefined
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
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen
            name="QuickAddExpense"
            component={QuickAddExpenseScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="WeeklyReport" component={WeeklyReportStoryScreen} />
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
