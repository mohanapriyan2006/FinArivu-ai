import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { LogBox } from 'react-native'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { FinancialProfileProvider } from '@/contexts/FinancialProfileContext'
import AppNavigator from '@/navigation/AppNavigator'

LogBox.ignoreLogs(['SafeAreaView has been deprecated'])
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FinancialProfileProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <QueryClientProvider client={queryClient}>
                <NavigationContainer>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </QueryClientProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </FinancialProfileProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
