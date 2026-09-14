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
import { ChevronLeft, Rocket } from 'lucide-react-native'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { useTheme } from '@/contexts/ThemeContext'
import { CARD_SHADOW } from '@/components/insights/Common'
import { AssetService, type AssetInput } from '@/services/AssetService'
import { CategoryService } from '@/services/CategoryService'
import { ExpenseService, type ExpenseInput } from '@/services/ExpenseService'
import { GoalService, type GoalInput } from '@/services/GoalService'
import { IncomeService, type IncomeInput } from '@/services/IncomeService'
import { LiabilityService, type LiabilityInput } from '@/services/LiabilityService'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import {
  getSectionSpec,
  resolveSectionBackground,
  resolveSectionColor,
} from './sectionConfig'

type SectionNavigationProp = StackNavigationProp<RootStackParamList>

type CategoryOption = { id: string; name: string }

const today = () => new Date().toISOString().split('T')[0]

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function isoYearEnd(yearsAhead: number): string {
  return `${new Date().getFullYear() + yearsAhead}-12-31`
}

const RECENT_DATE_PRESETS: { label: string; value: string }[] = [
  { label: 'Today', value: today() },
  { label: 'Yesterday', value: isoDaysAgo(1) },
  { label: '2 days ago', value: isoDaysAgo(2) },
]

const YEAR_DATE_PRESETS: { label: string; value: string }[] = [1, 2, 3, 5, 10].map((y) => ({
  label: `+${y}y`,
  value: isoYearEnd(y),
}))

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

export default function PulseSectionCreateScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<SectionNavigationProp>()
  const route = useRoute<{ key: string; name: string; params: { section: string; record?: Record<string, unknown> } }>()
  const { getToken } = useAuthContext()
  const { profile, saveSection } = useFinancialProfile()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const { section, record } = route.params
  const spec = getSectionSpec(section)
  const isEdit = record !== undefined && Object.keys(record).length > 0

  const [values, setValues] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    setValues(initial)
    setErrors({})
  }, [record, section, spec.fields])

  useEffect(() => {
    if (section !== 'expenses') return
    let cancelled = false
    async function loadCategories() {
      setCategoriesLoading(true)
      try {
        const token = await getToken()
        const list = await CategoryService.list(token)
        if (!cancelled) setCategories(list.map((c) => ({ id: c.id, name: c.name })))
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    }
    loadCategories()
    return () => {
      cancelled = true
    }
  }, [section, getToken])

  const updateValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {}
    for (const field of spec.fields) {
      if (!field.required) continue
      const v = (values[field.key] ?? '').trim()
      if (!v) {
        next[field.key] = `${field.label} is required`
      } else if (field.keyboard === 'numeric' && numberValue(v) <= 0) {
        next[field.key] = `Enter a valid ${field.label.toLowerCase()}`
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }, [spec.fields, values])

  const handleSave = useCallback(async () => {
    if (!validate()) return
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
          description: values.description ?? '',
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
          targetAmount: numberValue(values.targetAmount ?? '0'),
          currentAmount: toNumOrUndefined(values.currentAmount ?? ''),
          targetDate: values.targetDate ?? today(),
          status: 'Active',
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
  }, [section, values, record, isEdit, getToken, profile, saveSection, categories, navigation, validate])

  const iconColor = resolveSectionColor(spec.color, colors)
  const iconBg = resolveSectionBackground(spec.background, colors)
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
              <Text style={[styles.headerTitle, { color: colors.textHero }]}>
                {isEdit ? 'Edit' : 'Add'} {spec.title}
              </Text>
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

          {spec.fields.map((field, index) => {
            const error = errors[field.key]
            const hasError = Boolean(error)
            return (
              <Animated.View key={field.key} entering={FadeInUp.delay(100 + index * 50).springify()}>
                <View
                  style={[
                    styles.fieldCard,
                    { backgroundColor: colors.surface },
                    hasError ? { borderColor: colors.danger } : null,
                  ]}
                >
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    {field.required ? <Text style={[styles.requiredMark, { color: colors.danger }]}>*</Text> : null}
                  </View>
                  {field.helper ? <Text style={styles.fieldHelper}>{field.helper}</Text> : null}
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
                      {categoriesLoading ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : categories.length === 0 ? (
                        <Text style={styles.fieldHelper}>
                          No categories found. Pull to refresh on the expenses screen, then try again.
                        </Text>
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
                    <>
                      <View
                        style={[
                          styles.inputRow,
                          { backgroundColor: colors.background, borderColor: hasError ? colors.danger : colors.border },
                        ]}
                      >
                        {field.currency ? (
                          <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>₹</Text>
                        ) : null}
                        <TextInput
                          style={styles.inputFlex}
                          value={values[field.key] ?? ''}
                          onChangeText={(text) => updateValue(field.key, text)}
                          placeholder={field.placeholder ?? field.label}
                          placeholderTextColor={colors.textTertiary}
                          keyboardType={field.keyboard ?? 'default'}
                          accessibilityLabel={field.label}
                        />
                      </View>
                      {field.datePresets ? (
                        <View style={[styles.optionsRow, { marginTop: 10 }]}>
                          {(field.datePresets === 'recent' ? RECENT_DATE_PRESETS : YEAR_DATE_PRESETS).map(
                            (preset) => {
                              const selected = values[field.key] === preset.value
                              return (
                                <Pressable
                                  key={preset.label}
                                  onPress={() => updateValue(field.key, preset.value)}
                                  style={[
                                    styles.option,
                                    styles.dateChip,
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
                                      { color: selected ? colors.surface : colors.textSecondary },
                                    ]}
                                  >
                                    {preset.label}
                                  </Text>
                                </Pressable>
                              )
                            }
                          )}
                        </View>
                      ) : null}
                    </>
                  )}
                  {hasError ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
                </View>
              </Animated.View>
            )
          })}

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
      fontSize: Typography.sizes.h2,
      fontWeight: Typography.fontWeights.bold,
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
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    fieldLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    requiredMark: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.bold,
      marginLeft: 4,
    },
    fieldHelper: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      marginTop: 6,
    },
    currencyPrefix: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      marginRight: 8,
    },
    inputFlex: {
      flex: 1,
      paddingVertical: 14,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
    },
    dateChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    errorText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      marginTop: 8,
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
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
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
