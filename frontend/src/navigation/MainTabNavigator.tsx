import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import DashboardScreen from '@/screens/dashboard/DashboardScreen'
import IncomeScreen from '@/screens/income/IncomeScreen'
import ExpensesScreen from '@/screens/expenses/ExpensesScreen'
import BudgetScreen from '@/screens/budget/BudgetScreen'
import GoalsScreen from '@/screens/goals/GoalsScreen'
import InsightsScreen from '@/screens/insights/InsightsScreen'
import ProfileScreen from '@/screens/profile/ProfileScreen'

const Tab = createBottomTabNavigator()

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Income" component={IncomeScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
