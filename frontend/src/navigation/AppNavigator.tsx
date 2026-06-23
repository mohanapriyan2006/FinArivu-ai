import { createStackNavigator } from '@react-navigation/stack'

import { useAuthContext } from '@/contexts/AuthContext'
import AuthNavigator from './AuthNavigator'
import MainTabNavigator from './MainTabNavigator'
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen'

const Stack = createStackNavigator()

export default function AppNavigator() {
  const { isAuthenticated } = useAuthContext()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  )
}
