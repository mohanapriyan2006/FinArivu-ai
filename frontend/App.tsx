import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import AppNavigator from '@/navigation/AppNavigator'

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
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
