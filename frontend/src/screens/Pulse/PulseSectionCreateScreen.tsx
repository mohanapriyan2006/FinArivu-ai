import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Animated, { FadeInUp } from 'react-native-reanimated'
import {
  Banknote,
  Calculator,
  ChevronLeft,
  CreditCard,
  Landmark,
  Plus,
  Receipt,
  Rocket,
  Shield,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { useTheme } from '@/contexts/ThemeContext'
import { CARD_SHADOW } from '@/components/insights/Common'
import { AssetService, type AssetInput } from '@/services/AssetService'
import { CategoryService, type Category } from '@/services/CategoryService'
import { ExpenseService, type ExpenseInput } from '@/services/ExpenseService'
import { GoalService, type GoalInput } from '@/services/GoalService'
import { IncomeService, type IncomeInput } from '@/services/IncomeService'
import { LiabilityService, type LiabilityInput } from '@/services/LiabilityService'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/navigation/AppNavigator'

type SectionNavigationProp = StackNavigationProp<RootStackParamList>

type ColorKey = 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
type BackgroundKey = 'primaryBackground' | 'successBackground' | 'accentBackground' | 'dangerBackground' | 'surface'

interface SectionSpec {
  title: string
  icon: LucideIcon
  color: ColorKey
  background: BackgroundKey
  fields: CreateField[]
}

interface CreateField {
  key: string
  label: string
  placeholder?: string
  keyboard?: 'default' | 'numeric'
  options?: string[]
}

type CategoryOption = { id: string; name: string }

const today = () => new Date().toISOString().split('T')[0]

const SECTIONS: Record<string, SectionSpec> = {
  income: {
    title: 'Income',
    icon: Banknote,
    color: 'success',
    background: 'successBackground',
    fields: [
      { key: 'source', label: 'Source', placeholder: 'Salary' },
      { key: 'amount', label: 'Amount', placeholder: '50000', keyboard: 'numeric' },
      { key: 'incomeDate', label: 'Date', placeholder: today() },
      { key: 'notes', label: 'Notes (optional)', placeholder: 'Monthly salary' },
    ],
  },
  expenses: {
    title: 'Expense',
    icon: Receipt,
    color: 'danger',
    background: 'dangerBackground',
    fields: [
      { key: 'description', label: 'Description', placeholder: 'Grocery shopping' },
      { key: 'amount', label: 'Amount', placeholder: '1200', keyboard: 'numeric' },
      { key: 'expenseDate', label: 'Date', placeholder: today() },
      { key: 'categoryId', label: 'Category' },
    ],
  },
  savings: {
    title: 'Savings',
    icon: Wallet,
    color: 'success',
    background: 'successBackground',
    fields: [
      { key: 'name', label: 'Account name', placeholder: 'Emergency Fund' },
      { key: 'assetType', label: 'Account type', placeholder: 'Bank / Cash' },
      { key: 'value', label: 'Current value', placeholder: '50000', keyboard: 'numeric' },
    ],
  },
  investments: {
    title: 'Investment',
    icon: TrendingUp,
    color: 'primary',
    background: 'primaryBackground',
    fields: [
      { key: 'name', label: 'Investment name', placeholder: 'SBI Small Cap Fund' },
      { key: 'assetType', label: 'Investment type', placeholder: 'Mutual Fund / Stock' },
      { key: 'value', label: 'Current value', placeholder: '100000', keyboard: 'numeric' },
    ],
  },
  fixed_deposits: {
    title: 'Fixed Deposit',
    icon: Landmark,
    color: 'primary',
    background: 'primaryBackground',
    fields: [
      { key: 'name', label: 'FD name', placeholder: 'SBI Fixed Deposit' },
      { key: 'value', label: 'Value', placeholder: '100000', keyboard: 'numeric' },
      { key: 'interestRate', label: 'Interest rate (%)', placeholder: '7.5', keyboard: 'numeric' },
      { key: 'maturityDate', label: 'Maturity date', placeholder: '2030-12-31' },
    ],
  },
  loans: {
    title: 'Loan',
    icon: Banknote,
    color: 'danger',
    background: 'dangerBackground',
    fields: [
      { key: 'name', label: 'Loan name', placeholder: 'Home Loan' },
      { key: 'liabilityType', label: 'Loan type', placeholder: 'Personal / Home' },
      { key: 'amount', label: 'Outstanding amount', placeholder: '500000', keyboard: 'numeric' },
      { key: 'emi', label: 'Monthly EMI', placeholder: '25000', keyboard: 'numeric' },
    ],
  },
  credit_cards: {
    title: 'Credit Card',
    icon: CreditCard,
    color: 'secondary',
    background: 'primaryBackground',
    fields: [
      { key: 'name', label: 'Card name / bank', placeholder: 'HDFC Regalia' },
      { key: 'amount', label: 'Outstanding amount', placeholder: '15000', keyboard: 'numeric' },
      { key: 'creditLimit', label: 'Credit limit', placeholder: '200000', keyboard: 'numeric' },
      { key: 'monthlySpend', label: 'Monthly spend (optional)', placeholder: '30000', keyboard: 'numeric' },
    ],
  },
  insurance: {
    title: 'Insurance Policy',
    icon: Shield,
    color: 'success',
    background: 'successBackground',
    fields: [
      { key: 'type', label: 'Policy type', options: ['health', 'life'] },
      { key: 'coverage', label: 'Coverage amount', placeholder: '500000', keyboard: 'numeric' },
      { key: 'annualPremium', label: 'Annual premium', placeholder: '15000', keyboard: 'numeric' },
    ],
  },
  tax: {
    title: 'Tax Details',
    icon: Calculator,
    color: 'primary',
    background: 'primaryBackground',
    fields: [
      { key: 'annualIncome', label: 'Annual income', placeholder: '1200000', keyboard: 'numeric' },
      { key: 'taxRegime', label: 'Tax regime', options: ['old', 'new', 'not-sure'] },
      { key: 'deduction_80c', label: '80C deduction', placeholder: '150000', keyboard: 'numeric' },
      { key: 'deduction_80d', label: '80D deduction', placeholder: '25000', keyboard: 'numeric' },
      { key: 'homeLoanInterest', label: 'Home loan interest', placeholder: '0', keyboard: 'numeric' },
      { key: 'nps', label: 'NPS deduction', placeholder: '0', keyboard: 'numeric' },
      { key: 'other', label: 'Other deductions', placeholder: '0', keyboard: 'numeric' },
    ],
  },
  goals: {
    title: 'Goal',
    icon: Target,
    color: 'warning',
    background: 'accentBackground',
    fields: [
      { key: 'goalName', label: 'Goal name', placeholder: 'Dream Home' },
      { key: 'goalType', label: 'Goal type', placeholder: 'home / travel / education' },
      { key: 'targetAmount', label: 'Target amount', placeholder: '2000000', keyboard: 'numeric' },
      { key: 'currentAmount', label: 'Already saved (optional)', placeholder: '0', keyboard: 'numeric' },
      { key: 'targetDate', label: 'Target date', placeholder: today() },
    ],
  },
}

function resolveColor(key: ColorKey, colors: ThemeColors): string {
  switch (key) {
    case 'primary':
      return colors.primary
    case 'secondary':
      return colors.secondary
    case 'success':
      return colors.success
    case 'warning':
      return colors.warning
    case 'danger':
      return colors.danger
    default:
      return colors.primary
  }
}

function resolveBackground(key: BackgroundKey, colors: ThemeColors): string {
  switch (key) {
    case 'primaryBackground':
      return colors.primaryBackground
    case 'successBackground':
      return colors.successBackground
    case 'accentBackground':
      return colors.accentBackground
    case 'dangerBackground':
      return colors.dangerBackground
    case 'surface':
    default:
      return colors.surface
  }
}

function stringValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  return ''
}

function numberValue(value: string): number {
  return Number(value.replace(/[^0-9.]/g, '')) || 0
}

function toNumOrUndefined(value: string): number | undefined {
  const n = Number(value)
  return value === '' || Number.isNaN(n) ? undefined : n
}

function inferGoalType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('home') || lower.includes('house')) return 'home'
  if (lower.includes('car') || lower.includes('vehicle')) return 'vehicle'
  if (lower.includes('travel') || lower.includes('vacation')) return 'travel'
  if (lower.includes('education') || lower.includes('study')) return 'education'
  if (lower.includes('emergency')) return 'emergency'
  if (lower.includes('retirement')) return 'retirement'
  if (lower.includes('marriage') || lower.includes('wedding')) return 'marriage'
  if (lower.includes('wealth')) return 'wealth'
  return 'other'
}

export default function PulseSectionCreateScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<SectionNavigationProp>()
  const route = useRoute<{ key: string; name: string; params: { section: string; record?: Record<string, unknown> } }>()
  const { getToken } = useAuthContext()
  const { profile, saveSection } = useFinancialProfile()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const { section, record } = route.params
  const spec = SECTIONS[section] ?? {
    title: section,
    icon: Plus,
    color: 'primary' as ColorKey,
    background: 'primaryBackground' as BackgroundKey,
    fields: [{ key: 'name', label: 'Name' }],
  }
  const isEdit = record !== undefined && Object.keys(record).length > 0

  const [values, setValues] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const field of spec.fields) {
      initial[field.key] = ''
    }
    if (record) {
      for (const [key, value] of Object.entries(record)) {
        if (key === 'deductions' && value && typeof value === 'object') {
          const deductions = value as Record<string, number>
          initial.deduction_80c = deductions['80c']?.toString() ?? ''
          initial.deduction_80d = deductions['80d']?.toString() ?? ''
          initial.homeLoanInterest = deductions.homeLoanInterest?.toString() ?? ''
          initial.nps = deductions.nps?.toString() ?? ''
          initial.other = deductions.other?.toString() ?? ''
        } else {
          initial[key] = stringValue(value)
        }
      }
    }
    if (section === 'goals' && initial.goalType === '' && initial.goalName !== '') {
      initial.goalType = inferGoalType(initial.goalName)
    }
    setValues(initial)
  }, [record, section, spec.fields])

  useEffect(() => {
    if (section !== 'expenses') return
    let cancelled = false
    async function loadCategories() {
      try {
        const token = await getToken()
        const list = await CategoryService.list(token)
        if (!cancelled) setCategories(list.map((c) => ({ id: c.id, name: c.name })))
      } catch {
        if (!cancelled) setCategories([])
      }
    }
    loadCategories()
    return () => {
      cancelled = true
    }
  }, [section, getToken])

  const updateValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const token = await getToken()
      if (section === 'insurance') {
        const existing = profile.insurance?.policies ?? []
        const updated = existing.filter((p) => p.id !== (record?.id as string))
        const policyId = (record?.id as string) ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        updated.push({
          id: policyId,
          type: (values.type as 'health' | 'life') ?? 'health',
          coverage: numberValue(values.coverage ?? '0'),
          annualPremium: numberValue(values.annualPremium ?? '0'),
        })
        await saveSection({ section: 'insurance', data: { policies: updated } })
      } else if (section === 'tax') {
        await saveSection({
          section: 'taxDetails',
          data: {
            annualIncome: numberValue(values.annualIncome ?? '0'),
            taxRegime: (values.taxRegime as 'old' | 'new' | 'not-sure') ?? 'new',
            deductions: {
              '80c': toNumOrUndefined(values.deduction_80c ?? ''),
              '80d': toNumOrUndefined(values.deduction_80d ?? ''),
              homeLoanInterest: toNumOrUndefined(values.homeLoanInterest ?? ''),
              nps: toNumOrUndefined(values.nps ?? ''),
              other: toNumOrUndefined(values.other ?? ''),
            },
          },
        })
      } else if (section === 'income') {
        const input: IncomeInput = {
          source: values.source ?? '',
          amount: numberValue(values.amount ?? '0'),
          incomeDate: values.incomeDate ?? today(),
          notes: values.notes ?? '',
        }
        if (isEdit && record?.id) {
          await IncomeService.update(record.id as string, input, token)
        } else {
          await IncomeService.create(input, token)
        }
      } else if (section === 'expenses') {
        const input: ExpenseInput = {
          description: values.description ?? '',
          amount: numberValue(values.amount ?? '0'),
          expenseDate: values.expenseDate ?? today(),
          categoryId: values.categoryId ?? categories[0]?.id ?? '',
        }
        if (isEdit && record?.id) {
          await ExpenseService.update(record.id as string, input, token)
        } else {
          await ExpenseService.create(input, token)
        }
      } else if (section === 'savings' || section === 'investments' || section === 'fixed_deposits') {
        const input: AssetInput = {
          name: values.name ?? '',
          assetType:
            section === 'fixed_deposits'
              ? 'Fixed Deposit'
              : values.assetType || (section === 'savings' ? 'Bank' : 'Mutual Fund'),
          value: numberValue(values.value ?? '0'),
          currency: 'INR',
          isEmergencyFund: false,
          interestRate: toNumOrUndefined(values.interestRate ?? ''),
          maturityDate: values.maturityDate ?? undefined,
        }
        if (isEdit && record?.id) {
          await AssetService.update(record.id as string, input, token)
        } else {
          await AssetService.create(input, token)
        }
      } else if (section === 'loans' || section === 'credit_cards') {
        const input: LiabilityInput = {
          name: values.name ?? '',
          liabilityType: section === 'credit_cards' ? 'Credit Card' : values.liabilityType || 'Personal Loan',
          amount: numberValue(values.amount ?? '0'),
          currency: 'INR',
          emi: toNumOrUndefined(values.emi ?? ''),
          creditLimit: toNumOrUndefined(values.creditLimit ?? ''),
          monthlySpend: toNumOrUndefined(values.monthlySpend ?? ''),
        }
        if (isEdit && record?.id) {
          await LiabilityService.update(record.id as string, input, token)
        } else {
          await LiabilityService.create(input, token)
        }
      } else if (section === 'goals') {
        const input: GoalInput = {
          goalName: values.goalName ?? '',
          goalType: (values.goalType as string) ?? 'other',
          targetAmount: numberValue(values.targetAmount ?? '0'),
          currentAmount: toNumOrUndefined(values.currentAmount ?? ''),
          targetDate: values.targetDate ?? today(),
          status: 'active',
        }
        if (isEdit && record?.id) {
          await GoalService.update(record.id as string, input, token)
        } else {
          await GoalService.create(input, token)
        }
      }
      navigation.goBack()
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }, [section, values, record, isEdit, getToken, profile, saveSection, categories, navigation])

  const iconColor = resolveColor(spec.color, colors)
  const iconBg = resolveBackground(spec.background, colors)
  const Icon = spec.icon

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(0).springify()}>
            <View style={styles.header}>
              <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityRole="button">
                <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
              </Pressable>
              <Text style={styles.headerTitle}>{isEdit ? 'Edit' : 'Add'} {spec.title}</Text>
              <View style={styles.iconButton} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(50).springify()}>
            <View style={[styles.heroCard, { backgroundColor: iconBg }]}>
              <View style={[styles.heroIconBox, { backgroundColor: colors.surface }]}>
                <Icon size={32} color={iconColor} strokeWidth={2} />
              </View>
              <Text style={styles.heroTitle}>{isEdit ? 'Update your' : 'Add a new'} {spec.title.toLowerCase()}</Text>
              <Text style={styles.heroSubtitle}>
                {isEdit ? 'Make changes and save to update your records.' : 'Fill in the details to keep your finances up to date.'}
              </Text>
            </View>
          </Animated.View>

          {spec.fields.map((field, index) => (
            <Animated.View key={field.key} entering={FadeInUp.delay(100 + index * 50).springify()}>
              <View style={[styles.fieldCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {field.options ? (
                  <View style={styles.optionsRow}>
                    {field.options.map((option) => {
                      const selected = values[field.key] === option
                      return (
                        <Pressable
                          key={option}
                          onPress={() => updateValue(field.key, option)}
                          style={[
                            styles.option,
                            {
                              backgroundColor: selected ? colors.primary : colors.background,
                              borderColor: selected ? colors.primary : colors.border,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              { color: selected ? colors.surface : colors.textPrimary },
                            ]}
                          >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                ) : field.key === 'categoryId' ? (
                  <View style={styles.optionsRow}>
                    {categories.length === 0 ? (
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background }]}
                        value={values[field.key] ?? ''}
                        onChangeText={(text) => updateValue(field.key, text)}
                        placeholder="Category ID"
                        placeholderTextColor={colors.textTertiary}
                      />
                    ) : (
                      categories.map((cat) => {
                        const selected = values[field.key] === cat.id
                        return (
                          <Pressable
                            key={cat.id}
                            onPress={() => updateValue(field.key, cat.id)}
                            style={[
                              styles.option,
                              {
                                backgroundColor: selected ? colors.primary : colors.background,
                                borderColor: selected ? colors.primary : colors.border,
                              },
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                { color: selected ? colors.surface : colors.textPrimary },
                              ]}
                            >
                              {cat.name}
                            </Text>
                          </Pressable>
                        )
                      })
                    )}
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background }]}
                    value={values[field.key] ?? ''}
                    onChangeText={(text) => updateValue(field.key, text)}
                    placeholder={field.placeholder ?? field.label}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType={field.keyboard ?? 'default'}
                    accessibilityLabel={field.label}
                  />
                )}
              </View>
            </Animated.View>
          ))}

          <Animated.View entering={FadeInUp.delay(100 + spec.fields.length * 50).springify()}>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Rocket size={18} color={colors.surface} strokeWidth={2} style={styles.ctaIcon} />
                  <Text style={[styles.ctaText, { color: colors.surface }]}>
                    {isEdit ? 'Update' : 'Create'} {spec.title}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 20,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    heroCard: {
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      ...CARD_SHADOW,
    },
    heroIconBox: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    heroTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h2,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    fieldCard: {
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      ...CARD_SHADOW,
    },
    fieldLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    option: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
    },
    optionText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
    },
    ctaButton: {
      height: 56,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    ctaIcon: {
      marginRight: 8,
    },
    ctaText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
    },
  })
