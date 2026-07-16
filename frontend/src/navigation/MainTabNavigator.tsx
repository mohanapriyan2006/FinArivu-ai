import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { CustomBottomTabBar } from '@/components/navigation/CustomBottomTabBar'
import DashboardScreen from '@/screens/dashboard/DashboardScreen'
import InsightsScreen from '@/screens/insights/InsightsScreen'
import AICopilotScreen from '@/screens/chatbot/AICopilotScreen'
import GoalsScreen from '@/screens/goals/GoalsScreen'
import ProfileScreen from '@/screens/profile/ProfileScreen'

const Tab = createBottomTabNavigator()

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="AICopilot" component={AICopilotScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
