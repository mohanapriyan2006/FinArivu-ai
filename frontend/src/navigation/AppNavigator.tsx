import { createStackNavigator } from '@react-navigation/stack'

import { useAuthContext } from '@/contexts/AuthContext'
import AuthNavigator from './AuthNavigator'
import MainTabNavigator from './MainTabNavigator'
import SplashScreen from '@/screens/onboarding/SplashScreen'
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen'
import QuickAddExpenseScreen from '@/screens/expenses/QuickAddExpenseScreen'
import CreateGoalScreen from '@/screens/goals/CreateGoalScreen'
import NotificationsScreen from '@/screens/notifications/NotificationsScreen'
import EditProfileScreen from '@/screens/profile/EditProfileScreen'
import WeeklyReportStoryScreen from '@/screens/reports/WeeklyReportStoryScreen'

export type RootStackParamList = {
  Splash: undefined
  Onboarding: undefined
  Auth: undefined
  Main: undefined
  CreateGoal: undefined
  Notifications: undefined
  EditProfile: undefined
  QuickAddExpense: undefined
  WeeklyReport: undefined
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
