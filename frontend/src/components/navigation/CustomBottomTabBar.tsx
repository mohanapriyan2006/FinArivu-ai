import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Home, BarChart2, Bot, Target, User } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { TabBarItem } from './TabBarItem'

interface TabConfig {
  name: string
  label: string
  icon: typeof Home
  variant?: 'standard' | 'fab'
}

const TABS: TabConfig[] = [
  { name: 'Home', label: 'Home', icon: Home, variant: 'standard' },
  { name: 'Insights', label: 'Insights', icon: BarChart2, variant: 'standard' },
  { name: 'AICopilot', label: 'AI Copilot', icon: Bot, variant: 'fab' },
  { name: 'Goals', label: 'Goals', icon: Target, variant: 'standard' },
  { name: 'Profile', label: 'Profile', icon: User, variant: 'standard' },
]

export function CustomBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          alignItems: 'center',
        },
        container: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 4,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 16,
        },
        sideGroup: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
        },
        fabContainer: {
          width: 70,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors.surface, colors.shadowColor, insets.bottom]
  )

  const handlePress = (index: number, routeName: string) => {
    const isFocused = state.index === index

    if (isFocused) {
      return
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index].key,
      canPreventDefault: true,
    })

    if (!event.defaultPrevented) {
      navigation.navigate(routeName)
    }
  }

  const leftTabs = TABS.slice(0, 2)
  const rightTabs = TABS.slice(3)
  const isChatActive = state.routes[state.index]?.name === 'AICopilot'

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="auto">
        <View style={styles.sideGroup}>
          {leftTabs.map((tab) => {
            const routeIndex = state.routes.findIndex((route) => route.name === tab.name)
            const isFocused = state.index === routeIndex

            return (
              <TabBarItem
                key={tab.name}
                label={tab.label}
                icon={tab.icon}
                isActive={isFocused}
                onPress={() => handlePress(routeIndex, tab.name)}
                variant={tab.variant}
                testID={`tab-${tab.name}`}
              />
            )
          })}
        </View>

        <View style={styles.fabContainer}>
          {!isChatActive && (() => {
            const routeIndex = state.routes.findIndex((route) => route.name === 'AICopilot')
            const isFocused = state.index === routeIndex

            return (
              <TabBarItem
                label="AI Copilot"
                icon={Bot}
                isActive={isFocused}
                onPress={() => handlePress(routeIndex, 'AICopilot')}
                variant="fab"
                testID="tab-AICopilot"
              />
            )
          })()}
        </View>

        <View style={styles.sideGroup}>
          {rightTabs.map((tab) => {
            const routeIndex = state.routes.findIndex((route) => route.name === tab.name)
            const isFocused = state.index === routeIndex

            return (
              <TabBarItem
                key={tab.name}
                label={tab.label}
                icon={tab.icon}
                isActive={isFocused}
                onPress={() => handlePress(routeIndex, tab.name)}
                variant={tab.variant}
                testID={`tab-${tab.name}`}
              />
            )
          })}
        </View>
      </View>
    </View>
  )
}
