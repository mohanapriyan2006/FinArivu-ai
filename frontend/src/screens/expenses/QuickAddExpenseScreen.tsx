import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import {
  AlignJustify,
  ArrowLeft,
  Calendar,
  Car,
  Gamepad2,
  Heart,
  Home,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  Store,
  Utensils,
  Zap,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'
import { AmountHeader } from '@/components/expenses/AmountHeader'
import { CategoryButton } from '@/components/expenses/CategoryButton'
import { QuickAddInput } from '@/components/expenses/QuickAddInput'

interface CategoryConfig {
  id: string
  label: string
  icon: LucideIcon
  colorKey: 'primary' | 'success' | 'danger' | 'accent' | 'warning' | 'textSecondary'
}

const CATEGORY_CONFIG: CategoryConfig[] = [
  { id: 'food', label: 'Food', icon: Utensils, colorKey: 'danger' },
  { id: 'travel', label: 'Travel', icon: Car, colorKey: 'primary' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, colorKey: 'accent' },
  { id: 'rent', label: 'Rent', icon: Home, colorKey: 'success' },
  { id: 'bills', label: 'Bills', icon: Receipt, colorKey: 'warning' },
  { id: 'health', label: 'Health', icon: Heart, colorKey: 'danger' },
  { id: 'fun', label: 'Fun', icon: Gamepad2, colorKey: 'primary' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, colorKey: 'textSecondary' },
]

function getCategoryColors(
  colorKey: CategoryConfig['colorKey'],
  colors: ThemeColors
) {
  switch (colorKey) {
    case 'primary':
      return { icon: colors.primary, background: colors.primaryBackground }
    case 'success':
      return { icon: colors.success, background: colors.successBackground }
    case 'danger':
      return { icon: colors.danger, background: colors.dangerBackground }
    case 'accent':
      return { icon: colors.accent, background: colors.accentBackground }
    case 'warning':
      return { icon: colors.warning, background: colors.accentBackground }
    case 'textSecondary':
      return { icon: colors.textSecondary, background: colors.border }
  }
}

export default function QuickAddExpenseScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors, isDark, insets), [colors, isDark, insets])

  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  )
  const [notes, setNotes] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('food')

  const categoryRows = useMemo(() => {
    return [CATEGORY_CONFIG.slice(0, 4), CATEGORY_CONFIG.slice(4, 8)]
  }, [])

  const handleAmountChange = (value: string) => {
    const numeric = value.replace(/[^0-9.]/g, '')
    const parts = numeric.split('.')
    if (parts.length > 2) return
    setAmount(numeric)
  }

  const handleAddExpense = () => {
    // TODO: wire to expense service
    navigation.goBack()
  }

  const renderCategoryRow = (row: CategoryConfig[], index: number) => (
    <View key={index} style={styles.categoryRow}>
      {row.map((cat) => {
        const { icon, background } = getCategoryColors(cat.colorKey, colors)
        return (
          <CategoryButton
            key={cat.id}
            icon={cat.icon}
            label={cat.label}
            isActive={selectedCategory === cat.id}
            iconColor={icon}
            backgroundColor={background}
            onPress={() => setSelectedCategory(cat.id)}
          />
        )
      })}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.headerSide}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={24} color={colors.primary} strokeWidth={2} />
            </Pressable>
            <Text style={styles.headerTitle}>Quick Add</Text>
            <View style={styles.headerSide}>
              <Zap size={24} color={colors.primary} strokeWidth={2} />
            </View>
          </View>

          <AmountHeader amount={amount} onAmountChange={handleAmountChange} />

          <View style={styles.formSurface}>
            <Text style={styles.sectionTitle}>Select Category</Text>
            <View style={styles.categoryGrid}>
              {categoryRows.map((row, idx) => renderCategoryRow(row, idx))}
            </View>

            <View style={styles.inputsContainer}>
              <QuickAddInput
                icon={Store}
                placeholder="Merchant Name"
                value={merchant}
                onChangeText={setMerchant}
              />
              <QuickAddInput
                icon={Calendar}
                placeholder="Date"
                value={date}
                onChangeText={setDate}
              />
              <QuickAddInput
                icon={AlignJustify}
                placeholder="Notes"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={handleAddExpense}
              accessibilityRole="button"
              accessibilityLabel="Add expense"
            >
              <Text style={styles.addButtonText}>+ Add Expense</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors, isDark: boolean, insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    headerSide: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
      marginHorizontal: 8,
    },
    formSurface: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -20,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: insets.bottom + 24,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    categoryGrid: {
      gap: 8,
      marginBottom: 24,
    },
    categoryRow: {
      flexDirection: 'row',
      gap: 8,
    },
    inputsContainer: {
      gap: 16,
      marginBottom: 24,
    },
    addButton: {
      marginTop: 'auto',
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    addButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
