import { useMemo } from 'react'
import { Image, StyleSheet, View } from 'react-native'
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
      <Image source={require('../../../assets/logo.png')} style={{ width: size, height: size }} />
    </View>
  )
}
