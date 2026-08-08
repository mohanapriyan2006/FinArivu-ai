import { useMemo } from 'react'
import {
  StyleSheet,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'

interface ProfileProgressBarProps {
  percentage: number
  testID?: string
}

export function ProfileProgressBar({
  percentage,
  testID,
}: ProfileProgressBarProps) {
  const { colors } = useTheme()
  const clamped = Math.min(100, Math.max(0, percentage))

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.border,
          overflow: 'hidden',
          width: '100%',
        },
        fill: {
          height: '100%',
          borderRadius: 4,
          backgroundColor: colors.primary,
          width: `${clamped}%`,
        },
      }),
    [colors, clamped]
  )

  return (
    <View style={styles.track} testID={testID}>
      <View style={styles.fill} />
    </View>
  )
}
