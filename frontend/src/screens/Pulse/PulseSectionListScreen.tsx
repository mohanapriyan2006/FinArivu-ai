import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Animated, { FadeInUp } from 'react-native-reanimated'
import {
  Banknote,
  Calculator,
  ChevronLeft,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Receipt,
  Shield,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { useTheme } from '@/contexts/ThemeContext'
import { CARD_SHADOW } from '@/components/insights/Common'
import { AssetService, type Asset } from '@/services/AssetService'
import { ExpenseService, type Expense } from '@/services/ExpenseService'
import { GoalService, type Goal } from '@/services/GoalService'
import { IncomeService, type Income } from '@/services/IncomeService'
import { LiabilityService, type Liability } from '@/services/LiabilityService'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { formatInrNumber } from '@/utils/formatInr'
import type { FinancialProfile } from '@/types/financialProfile'
import type { RootStackParamList } from '@/navigation/AppNavigator'

type SectionNavigationProp = StackNavigationProp<RootStackParamList>

type SectionRecord = {
  id: string
  title: string
  subtitle: string
  amount?: string
  meta?: string
  iconColor: string
  iconBackground: string
  raw: Record<string, unknown>
}

type ColorKey = 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
type BackgroundKey = 'primaryBackground' | 'successBackground' | 'accentBackground' | 'dangerBackground' | 'surface'

interface SectionSpec {
  title: string
  icon: LucideIcon
  color: ColorKey
  background: BackgroundKey
  emptyTitle: string
  emptyMessage: string
}

const SAVINGS_TYPES = new Set(['Bank', 'Cash', 'Savings Account', 'Current Account', 'Emergency Fund'])
const FIXED_TYPES = new Set(['Fixed Deposit', 'FD'])

const SECTIONS: Record<string, SectionSpec> = {
  income: {
    title: 'Income',
    icon: Banknote,
    color: 'success',
    background: 'successBackground',
    emptyTitle: 'No income added yet',
    emptyMessage: 'Add your salary and other income sources.',
  },
  expenses: {
    title: 'Expenses',
    icon: Receipt,
    color: 'danger',
    background: 'dangerBackground',
    emptyTitle: 'No expenses added yet',
    emptyMessage: 'Track your daily spending here.',
  },
  savings: {
    title: 'Savings',
    icon: Wallet,
    color: 'success',
    background: 'successBackground',
    emptyTitle: 'No savings added yet',
    emptyMessage: 'Add your bank accounts and emergency funds.',
  },
  investments: {
    title: 'Investments',
    icon: TrendingUp,
    color: 'primary',
    background: 'primaryBackground',
    emptyTitle: 'No investments added yet',
    emptyMessage: 'Add mutual funds, stocks, PPF, gold and more.',
  },
  fixed_deposits: {
    title: 'Fixed Deposits',
    icon: Landmark,
    color: 'primary',
    background: 'primaryBackground',
    emptyTitle: 'No fixed deposits added yet',
    emptyMessage: 'Track your FDs and their maturity.',
  },
  loans: {
    title: 'Loans & EMIs',
    icon: Banknote,
    color: 'danger',
    background: 'dangerBackground',
    emptyTitle: 'No loans added yet',
    emptyMessage: 'Track your outstanding loans and EMIs.',
  },
  credit_cards: {
    title: 'Credit Cards',
    icon: CreditCard,
    color: 'secondary',
    background: 'primaryBackground',
    emptyTitle: 'No credit cards added yet',
    emptyMessage: 'Track your cards, limits and spends.',
  },
  insurance: {
    title: 'Insurance',
    icon: Shield,
    color: 'success',
    background: 'successBackground',
    emptyTitle: 'No insurance policies added yet',
    emptyMessage: 'Add your health and life insurance policies.',
  },
  tax: {
    title: 'Tax',
    icon: Calculator,
    color: 'primary',
    background: 'primaryBackground',
    emptyTitle: 'No tax details added yet',
    emptyMessage: 'Add your tax regime and deductions.',
  },
  goals: {
    title: 'Goals',
    icon: Target,
    color: 'warning',
    background: 'accentBackground',
    emptyTitle: 'No goals added yet',
    emptyMessage: 'Set a goal and get an AI savings plan.',
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

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function normalizeIncome(items: Income[], colors: ThemeColors, spec: SectionSpec): SectionRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.source,
    subtitle: formatDate(item.incomeDate),
    amount: `₹${formatInrNumber(item.amount)}`,
    meta: item.notes ?? undefined,
    iconColor: resolveColor(spec.color, colors),
    iconBackground: resolveBackground(spec.background, colors),
    raw: item as unknown as unknown as Record<string, unknown>,
  }))
}

function normalizeExpenses(items: Expense[], colors: ThemeColors, spec: SectionSpec): SectionRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.description ?? 'Expense',
    subtitle: formatDate(item.expenseDate),
    amount: `₹${formatInrNumber(item.amount)}`,
    iconColor: resolveColor(spec.color, colors),
    iconBackground: resolveBackground(spec.background, colors),
    raw: item as unknown as unknown as Record<string, unknown>,
  }))
}

function normalizeAssets(
  items: Asset[],
  colors: ThemeColors,
  spec: SectionSpec
): SectionRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: item.assetType,
    amount: `₹${formatInrNumber(item.value)}`,
    meta: item.interestRate !== undefined && item.interestRate !== null ? `${item.interestRate}%` : undefined,
    iconColor: resolveColor(spec.color, colors),
    iconBackground: resolveBackground(spec.background, colors),
    raw: item as unknown as unknown as Record<string, unknown>,
  }))
}

function normalizeLiabilities(
  items: Liability[],
  colors: ThemeColors,
  spec: SectionSpec
): SectionRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: item.liabilityType,
    amount: `₹${formatInrNumber(item.amount)}`,
    meta: item.emi ? `EMI ₹${formatInrNumber(item.emi)}` : undefined,
    iconColor: resolveColor(spec.color, colors),
    iconBackground: resolveBackground(spec.background, colors),
    raw: item as unknown as unknown as Record<string, unknown>,
  }))
}

function normalizeGoals(items: Goal[], colors: ThemeColors, spec: SectionSpec): SectionRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.goalName,
    subtitle: item.goalType,
    amount: `₹${formatInrNumber(item.targetAmount)}`,
    meta: item.currentAmount ? `Saved ₹${formatInrNumber(item.currentAmount)}` : undefined,
    iconColor: resolveColor(spec.color, colors),
    iconBackground: resolveBackground(spec.background, colors),
    raw: item as unknown as unknown as Record<string, unknown>,
  }))
}

function normalizeInsurance(
  policies: { id: string; type?: string; coverage?: number; annualPremium?: number }[],
  colors: ThemeColors,
  spec: SectionSpec
): SectionRecord[] {
  return policies.map((p) => ({
    id: p.id,
    title: `${p.type ?? 'Policy'} Insurance`,
    subtitle: p.coverage ? `Coverage ₹${formatInrNumber(p.coverage)}` : '',
    amount: p.annualPremium ? `₹${formatInrNumber(p.annualPremium)}/yr` : undefined,
    iconColor: resolveColor(spec.color, colors),
    iconBackground: resolveBackground(spec.background, colors),
    raw: p as unknown as Record<string, unknown>,
  }))
}

function normalizeTax(
  tax: { annualIncome: number; taxRegime: string; deductions?: Record<string, number> },
  colors: ThemeColors,
  spec: SectionSpec
): SectionRecord[] {
  return [
    {
      id: 'tax-details',
      title: 'Tax Details',
      subtitle: `${tax.taxRegime} regime`,
      amount: `₹${formatInrNumber(tax.annualIncome)}`,
      meta: tax.deductions
        ? `Deductions ₹${formatInrNumber(
            Object.values(tax.deductions).reduce((a, b) => a + (b ?? 0), 0)
          )}`
        : undefined,
      iconColor: resolveColor(spec.color, colors),
      iconBackground: resolveBackground(spec.background, colors),
      raw: tax as unknown as Record<string, unknown>,
    },
  ]
}

async function loadSectionRecords(
  section: string,
  token: string | null,
  profile: FinancialProfile,
  colors: ThemeColors,
  spec: SectionSpec
): Promise<SectionRecord[]> {
  switch (section) {
    case 'income':
      return normalizeIncome(await IncomeService.list(token), colors, spec)
    case 'expenses':
      return normalizeExpenses(await ExpenseService.list(token), colors, spec)
    case 'savings':
      return normalizeAssets(
        (await AssetService.list(token)).filter((a) => SAVINGS_TYPES.has(a.assetType)),
        colors,
        spec
      )
    case 'investments':
      return normalizeAssets(
        (await AssetService.list(token)).filter((a) => !SAVINGS_TYPES.has(a.assetType) && !FIXED_TYPES.has(a.assetType)),
        colors,
        spec
      )
    case 'fixed_deposits':
      return normalizeAssets(
        (await AssetService.list(token)).filter((a) => FIXED_TYPES.has(a.assetType)),
        colors,
        spec
      )
    case 'loans':
      return normalizeLiabilities(
        (await LiabilityService.list(token)).filter((l) => l.liabilityType.toLowerCase() !== 'credit card'),
        colors,
        spec
      )
    case 'credit_cards':
      return normalizeLiabilities(
        (await LiabilityService.list(token)).filter((l) => l.liabilityType.toLowerCase() === 'credit card'),
        colors,
        spec
      )
    case 'goals':
      return normalizeGoals(await GoalService.list(token), colors, spec)
    case 'insurance':
      return normalizeInsurance(profile.insurance?.policies ?? [], colors, spec)
    case 'tax':
      return profile.taxDetails
        ? normalizeTax(profile.taxDetails as unknown as { annualIncome: number; taxRegime: string; deductions?: Record<string, number> }, colors, spec)
        : []
    default:
      return []
  }
}

export default function PulseSectionListScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<SectionNavigationProp>()
  const route = useRoute<{ key: string; name: string; params: { section: string } }>()
  const { getToken } = useAuthContext()
  const { profile, saveSection } = useFinancialProfile()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const section = route.params.section
  const spec = SECTIONS[section] ?? {
    title: section,
    icon: Banknote,
    color: 'primary' as ColorKey,
    background: 'primaryBackground' as BackgroundKey,
    emptyTitle: `No ${section} added yet`,
    emptyMessage: 'Add your first record.',
  }
  const Icon = spec.icon

  const [records, setRecords] = useState<SectionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const items = await loadSectionRecords(section, token, profile, colors, spec)
      setRecords(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records')
    } finally {
      setIsLoading(false)
    }
  }, [section, profile, getToken, colors, spec])

  useFocusEffect(
    useCallback(() => {
      fetch()
    }, [fetch])
  )

  const handleAdd = useCallback(() => {
    navigation.navigate('PulseSectionCreate', { section })
  }, [navigation, section])

  const handleEdit = useCallback(
    (record: SectionRecord) => {
      navigation.navigate('PulseSectionCreate', { section, record: record.raw })
    },
    [navigation, section]
  )

  const deleteRecord = useCallback(
    async (record: SectionRecord) => {
      try {
        const token = await getToken()
        switch (section) {
          case 'income':
            await IncomeService.delete(record.id, token)
            break
          case 'expenses':
            await ExpenseService.delete(record.id, token)
            break
          case 'savings':
          case 'investments':
          case 'fixed_deposits':
            await AssetService.delete(record.id, token)
            break
          case 'loans':
          case 'credit_cards':
            await LiabilityService.delete(record.id, token)
            break
          case 'goals':
            await GoalService.delete(record.id, token)
            break
          case 'insurance': {
            const existing = profile.insurance?.policies ?? []
            const updated = existing.filter((p) => p.id !== record.id)
            await saveSection({ section: 'insurance', data: { policies: updated } })
            break
          }
          case 'tax':
            // Tax is a single record; redirect to profile setup for removal
            navigation.navigate('FinancialProfileSetup', { startStep: 'taxDetails' })
            return
          default:
            return
        }
        await fetch()
      } catch (err) {
        Alert.alert('Could not delete', err instanceof Error ? err.message : 'Something went wrong')
      }
    },
    [section, getToken, profile, saveSection, fetch, navigation]
  )

  const handleDelete = useCallback(
    (record: SectionRecord) => {
      Alert.alert('Delete record?', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecord(record) },
      ])
    },
    [deleteRecord]
  )

  const iconColor = resolveColor(spec.color, colors)
  const iconBg = resolveBackground(spec.background, colors)

  const renderItem = ({ item, index }: { item: SectionRecord; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 40).springify()}
      style={[styles.card, { backgroundColor: colors.surface }, index % 2 === 1 ? { backgroundColor: colors.background } : null]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Icon size={22} color={iconColor} strokeWidth={2} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
          {item.meta ? <Text style={styles.cardMeta}>{item.meta}</Text> : null}
        </View>
        <View style={styles.cardTrailing}>
          {item.amount ? <Text style={[styles.cardAmount, { color: iconColor }]}>{item.amount}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              onPress={() => handleEdit(item)}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Edit record"
            >
              <Pencil size={18} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Delete record"
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBox, { backgroundColor: iconBg }]}>
        <Icon size={36} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>{spec.emptyTitle}</Text>
      <Text style={styles.emptyMessage}>{spec.emptyMessage}</Text>
      <Pressable onPress={handleAdd} style={[styles.addButton, { backgroundColor: colors.primary }]}>
        <Plus size={18} color={colors.surface} strokeWidth={2} />
        <Text style={[styles.addButtonText, { color: colors.surface }]}>Add {spec.title}</Text>
      </Pressable>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityRole="button">
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{spec.title}</Text>
        <Pressable
          onPress={handleAdd}
          style={[styles.headerAdd, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <Plus size={18} color={colors.surface} strokeWidth={2} />
          <Text style={[styles.headerAddText, { color: colors.surface }]}>Add</Text>
        </Pressable>
      </View>

      {isLoading && records.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetch} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetch} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListEmptyComponent={renderEmpty}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
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
      color: colors.textPrimary,
    },
    headerAdd: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
    },
    headerAddText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      marginLeft: 6,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingTop: 8,
    },
    card: {
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      ...CARD_SHADOW,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    cardContent: {
      flex: 1,
      justifyContent: 'center',
    },
    cardTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
    cardMeta: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textTertiary,
      marginTop: 2,
    },
    cardTrailing: {
      alignItems: 'flex-end',
    },
    cardAmount: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.bold,
      marginBottom: 6,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      marginTop: 80,
    },
    emptyIconBox: {
      width: 80,
      height: 80,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h2,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 20,
    },
    addButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      marginLeft: 8,
    },
    errorBanner: {
      margin: 20,
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.dangerBackground,
      alignItems: 'center',
    },
    errorText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: 12,
    },
    retry: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.danger,
    },
    retryText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
