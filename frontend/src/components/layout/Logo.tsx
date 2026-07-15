import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'

import { useTheme } from '@/contexts/ThemeContext'

interface LogoProps {
  size?: number
  testID?: string
}

export function Logo({ size = 48, testID }: LogoProps) {
  const { colors } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 16,
          backgroundColor: colors.surface,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        },
      }),
    [colors.shadowColor, colors.surface, size]
  )

  return (
    <View style={styles.container} testID={testID}>
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 48 48" fill="none">
        <Rect width="48" height="48" rx="10" fill={colors.primaryBackground} />
        <Path
          d="M10 26c4-3 8-1 12 2s8 4 12 0"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d="M10 34c4-3 8-1 12 2s8 4 12 0"
          stroke={colors.accent}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d="M14 18c3-2 6-1 9 1s6 3 9-1"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.6}
        />
      </Svg>
    </View>
  )
}
