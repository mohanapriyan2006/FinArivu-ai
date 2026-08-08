import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ChevronDown, ChevronUp } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { FadeInUp } from '@/components/animation'
import { Typography } from '@/theme'

interface ExpandableAdvancedSectionProps {
  title: string
  children: React.ReactNode
  testID?: string
}

export function ExpandableAdvancedSection({
  title,
  children,
  testID,
}: ExpandableAdvancedSectionProps) {
  const { colors } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      marginTop: 8,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
      minHeight: 44,
    },
    title: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    content: {
      marginTop: 4,
    },
  })

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        onPress={() => setIsExpanded((prev) => !prev)}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Hide advanced details' : 'Show advanced details'}
        accessibilityHint={title}
        testID={testID ? `${testID}-toggle` : undefined}
      >
        <Text style={styles.title}>+ {title}</Text>
        {isExpanded ? (
          <ChevronUp size={18} color={colors.primary} strokeWidth={2.5} />
        ) : (
          <ChevronDown size={18} color={colors.primary} strokeWidth={2.5} />
        )}
      </Pressable>
      {isExpanded ? (
        <FadeInUp duration={250} offset={12} testID={testID ? `${testID}-content` : undefined}>
          <View style={styles.content}>{children}</View>
        </FadeInUp>
      ) : null}
    </View>
  )
}
