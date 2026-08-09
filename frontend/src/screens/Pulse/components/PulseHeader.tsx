import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { Bell } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '@/navigation/AppNavigator'

interface PulseHeaderProps {
  testID?: string
}

export function PulseHeader({ testID }: PulseHeaderProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()


  const handleNotifications = () => {
    navigation.navigate('Notifications')
  }

  return (
    <View style={styles.container} testID={testID}>
      <View>
        <Text style={styles.title}>Pulse</Text>
        <Text style={styles.subtitle}>Your financial control center</Text>
      </View>
      <Pressable
        onPress={handleNotifications}
        style={styles.bellButton}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Bell size={22} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h1,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textHero,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
    bellButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
