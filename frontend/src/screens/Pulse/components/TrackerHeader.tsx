import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ArrowLeft, Plus } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface TrackerHeaderProps {
  title: string
  onAdd?: () => void
  addLabel?: string
  testID?: string
}

export function TrackerHeader({ title, onAdd, addLabel, testID }: TrackerHeaderProps) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const navigation = useNavigation()

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.iconButton}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          style={styles.iconButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel={addLabel ?? 'Add'}
        >
          <Plus size={24} color={colors.primary} strokeWidth={2} />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: Typography.h2.fontSize,
      lineHeight: Typography.h2.lineHeight,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      flex: 1,
    },
    iconButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })
