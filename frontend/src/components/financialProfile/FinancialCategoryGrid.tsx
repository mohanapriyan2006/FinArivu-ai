import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface Category {
  id: string
  icon: LucideIcon
  label: string
}

interface FinancialCategoryGridProps {
  categories: Category[]
  selectedIds: string[]
  onToggle: (id: string) => void
  columns?: number
  testID?: string
}

export function FinancialCategoryGrid({
  categories,
  selectedIds,
  onToggle,
  columns = 3,
  testID,
}: FinancialCategoryGridProps) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -6,
        },
        itemWrapper: {
          width: `${100 / columns}%`,
          padding: 6,
        },
        item: {
          aspectRatio: 1,
          borderRadius: 18,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
        },
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.medium,
          textAlign: 'center',
          marginTop: 6,
        },
      }),
    [columns, colors]
  )

  return (
    <View style={styles.container} testID={testID}>
      {categories.map((category) => {
        const isSelected = selectedIds.includes(category.id)
        const Icon = category.icon
        return (
          <View key={category.id} style={styles.itemWrapper}>
            <Pressable
              onPress={() => onToggle(category.id)}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: isSelected
                    ? colors.primaryBackground
                    : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={category.label}
              accessibilityState={{ selected: isSelected }}
              testID={testID ? `${testID}-category-${category.id}` : undefined}
            >
              <Icon
                size={26}
                color={isSelected ? colors.primary : colors.textSecondary}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isSelected ? colors.primary : colors.textPrimary,
                    fontWeight: isSelected
                      ? Typography.fontWeights.semibold
                      : Typography.fontWeights.medium,
                  },
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}
