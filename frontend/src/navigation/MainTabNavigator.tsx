import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import type { MainTabParamList } from '@/types/navigation'

import { CustomBottomTabBar } from '@/components/navigation/CustomBottomTabBar'
import HomeScreen from '@/screens/dashboard/HomeScreen'
import MoneyRadarScreen from '@/screens/moneyRadar/MoneyRadarScreen'
import CopilotScreen from '@/screens/chatbot/CopilotScreen'
import PulseScreen from '@/screens/Pulse/PulseScreen'
import ProfileScreen from '@/screens/profile/ProfileScreen'

const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pulse" component={PulseScreen} />
      <Tab.Screen name="AICopilot" component={CopilotScreen} />
      <Tab.Screen name="Insights" component={MoneyRadarScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
