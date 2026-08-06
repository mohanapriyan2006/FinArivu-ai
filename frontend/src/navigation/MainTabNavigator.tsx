import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { CustomBottomTabBar } from '@/components/navigation/CustomBottomTabBar'
import HomeScreen from '@/screens/dashboard/HomeScreen'
import InsightsHubScreen from '@/screens/insights/InsightsHubScreen'
import AIChatScreen from '@/screens/chatbot/AIChatScreen'
import PulseScreen from '@/screens/goals/PulseScreen'
import ProfileScreen from '@/screens/profile/ProfileScreen'

const Tab = createBottomTabNavigator()

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Insights" component={InsightsHubScreen} />
      <Tab.Screen name="AICopilot" component={AIChatScreen} />
      <Tab.Screen name="Goals" component={PulseScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
