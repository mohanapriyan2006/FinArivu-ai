import { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import { useAuthContext } from '@/contexts/AuthContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { usePulse } from '@/hooks/usePulse'
import { useTheme } from '@/contexts/ThemeContext'
import { AssetService } from '@/services/AssetService'
import { LiabilityService } from '@/services/LiabilityService'
import type { FormField } from './components/AddRecordSheet'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PulseAttentionItem, PulseFinanceItem, PulseQuickAction } from '@/screens/Pulse/types'
import { QUICK_ACTIONS, MORE_ACTIONS } from '@/screens/Pulse/pulseViewModel'

import { PulseHeader } from './components/PulseHeader'
import { PulseQuickActions } from './components/PulseQuickActions'
import { AddRecordSheet } from './components/AddRecordSheet'
import { PulseAddBottomSheet } from './components/PulseAddBottomSheet'
import { PulseNeedsAttention } from './components/PulseNeedsAttention'
import { FinanceControlRow } from './components/FinanceControlRow'
import { PulseGoals } from './components/PulseGoals'
import { PulseRecentActivity } from './components/PulseRecentActivity'
import { PulseProfileCompletion } from './components/PulseProfileCompletion'

type PulseNavigationProp = StackNavigationProp<RootStackParamList>
type AddSheetType = 'savings' | 'investment' | 'loan' | 'credit_card' | 'fixed_deposit'

const ADD_SHEET_FIELDS: Record<AddSheetType, FormField[]> = {
  savings: [
    { key: 'name', label: 'Account name', placeholder: 'Emergency Fund' },
    { key: 'assetType', label: 'Account type', placeholder: 'Bank / Cash' },
    { key: 'value', label: 'Current value', placeholder: '50000', keyboard: 'numeric' },
  ],
  investment: [
    { key: 'name', label: 'Investment name', placeholder: 'SBI Small Cap Fund' },
    { key: 'assetType', label: 'Investment type', placeholder: 'Mutual Fund / Stock' },
    { key: 'value', label: 'Current value', placeholder: '100000', keyboard: 'numeric' },
  ],
  loan: [
    { key: 'name', label: 'Loan name', placeholder: 'Home Loan' },
    { key: 'liabilityType', label: 'Loan type', placeholder: 'Personal / Home' },
    { key: 'amount', label: 'Outstanding amount', placeholder: '500000', keyboard: 'numeric' },
    { key: 'emi', label: 'Monthly EMI', placeholder: '25000', keyboard: 'numeric' },
  ],
  credit_card: [
    { key: 'name', label: 'Card name / bank', placeholder: 'HDFC Regalia' },
    { key: 'amount', label: 'Outstanding amount', placeholder: '15000', keyboard: 'numeric' },
    { key: 'creditLimit', label: 'Credit limit', placeholder: '200000', keyboard: 'numeric' },
  ],
  fixed_deposit: [
    { key: 'name', label: 'FD name', placeholder: 'SBI Fixed Deposit' },
    { key: 'value', label: 'Value', placeholder: '100000', keyboard: 'numeric' },
    { key: 'interestRate', label: 'Interest rate (%)', placeholder: '7.5', keyboard: 'numeric' },
  ],
}

const ADD_SHEET_TITLES: Record<AddSheetType, string> = {
  savings: 'Add Savings',
  investment: 'Add Investment',
  loan: 'Add Loan',
  credit_card: 'Add Credit Card',
  fixed_deposit: 'Add Fixed Deposit',
}

export default function PulseScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<PulseNavigationProp>()
  const { getToken } = useAuthContext()
  const { dismissed } = useFinancialProfile()
  const { state, isLoading, error, refetch } = usePulse()

  const [moreVisible, setMoreVisible] = useState(false)
  const [addSheetVisible, setAddSheetVisible] = useState(false)
  const [addSheetType, setAddSheetType] = useState<AddSheetType | null>(null)
  const styles = useMemo(() => makeStyles(colors), [colors])

  const handleQuickAction = (action: PulseQuickAction) => {
    if (action.route === '__more__') {
      setMoreVisible(true)
      return
    }
    navigation.navigate(action.route as keyof RootStackParamList, action.params as never)
  }

  const handleSheetSelect = (action: PulseQuickAction) => {
    setMoreVisible(false)
    if (action.route.startsWith('__add_')) {
      const type = action.route.replace('__add_', '') as AddSheetType | 'investment' | 'savings' | 'loan' | 'credit_card' | 'fd'
      const sheetType: AddSheetType = type === 'fd' ? 'fixed_deposit' : type
      if (ADD_SHEET_TITLES[sheetType]) {
        openAddSheet(sheetType)
        return
      }
    }
    navigation.navigate(action.route as keyof RootStackParamList, action.params as never)
  }

  const trackerRoute = (type: PulseFinanceItem['type']): keyof RootStackParamList | null => {
    switch (type) {
      case 'expense':
        return 'ExpenseTracker'
      case 'budget':
        return 'BudgetTracker'
      case 'savings':
        return 'SavingsTracker'
      case 'investment':
        return 'InvestmentTracker'
      case 'goal':
        return 'GoalsTracker'
      case 'loan':
        return 'LoanTracker'
      case 'credit_card':
        return 'CreditCardTracker'
      case 'insurance':
        return 'InsuranceTracker'
      case 'tax':
      default:
        return null
    }
  }

  const openAddSheet = (type: AddSheetType) => {
    setAddSheetType(type)
    setAddSheetVisible(true)
  }

  const closeAddSheet = () => {
    setAddSheetVisible(false)
    setAddSheetType(null)
  }

  const handleFinancePress = (item: PulseFinanceItem) => {
    if (item.status === 'empty') {
      switch (item.type) {
        case 'savings':
        case 'investment':
          openAddSheet(item.type)
          return
        case 'loan':
          openAddSheet('loan')
          return
        case 'credit_card':
          openAddSheet('credit_card')
          return
        case 'expense':
          navigation.navigate('QuickAddExpense')
          return
        case 'goal':
          navigation.navigate('CreateGoal')
          return
        case 'budget':
          navigation.navigate('FinancialProfileSetup', { startStep: 'expenses' })
          return
        case 'insurance':
        case 'tax':
          navigation.navigate('FinancialProfileSetup', { startStep: item.routeStep ?? 'insurance' })
          return
      }
    }

    const route = item.route ?? trackerRoute(item.type)
    if (route) {
      navigation.navigate(route as keyof RootStackParamList, undefined as never)
      return
    }
    if (item.routeStep) {
      navigation.navigate('FinancialProfileSetup', { startStep: item.routeStep })
    }
  }

  const handleAddSubmit = async (values: Record<string, string>) => {
    if (!addSheetType) return
    try {
      const token = await getToken()
      switch (addSheetType) {
        case 'savings':
        case 'fixed_deposit':
        case 'investment':
          await AssetService.create(
            {
              name: values.name,
              assetType: addSheetType === 'fixed_deposit' ? 'Fixed Deposit' : values.assetType || 'Bank',
              value: Number(values.value || '0'),
              interestRate: values.interestRate ? Number(values.interestRate) : undefined,
              isEmergencyFund: false,
            },
            token
          )
          break
        case 'loan':
          await LiabilityService.create(
            {
              name: values.name,
              liabilityType: values.liabilityType || 'Personal Loan',
              amount: Number(values.amount || '0'),
              emi: values.emi ? Number(values.emi) : undefined,
            },
            token
          )
          break
        case 'credit_card':
          await LiabilityService.create(
            {
              name: values.name,
              liabilityType: 'Credit Card',
              amount: Number(values.amount || '0'),
              creditLimit: values.creditLimit ? Number(values.creditLimit) : undefined,
            },
            token
          )
          break
      }
      closeAddSheet()
      refetch()
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handleAttentionPress = (item: PulseAttentionItem) => {
    navigation.navigate('FinancialProfileSetup', { startStep: item.routeStep })
  }

  const handleViewGoals = () => {
    navigation.navigate('FinancialProfileSetup', { startStep: 'goals' })
  }

  if (isLoading && !error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <PulseSkeleton />
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <PulseHeader testID="pulse-header" />

        <PulseQuickActions
          actions={QUICK_ACTIONS}
          onAction={handleQuickAction}
          testID="pulse-quick-actions"
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              Some financial data could not be loaded.
            </Text>
            <Pressable
              onPress={refetch}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Retry loading data"
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {state.isNewUser ? (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Your financial control center</Text>
            <Text style={styles.welcomeBody}>
              Add your first financial details to start tracking your money.
            </Text>
          </View>
        ) : (
          <>
            {state.attention.length > 0 ? (
              <PulseNeedsAttention
                items={state.attention}
                onPress={handleAttentionPress}
                testID="pulse-needs-attention"
              />
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Finances</Text>
            </View>

            {state.finances.map((item) => (
              <FinanceControlRow
                key={item.id}
                item={item}
                onPress={() => handleFinancePress(item)}
                testID={`pulse-finance-${item.id}`}
              />
            ))}

            {state.goals.length > 0 ? (
              <PulseGoals
                goals={state.goals}
                onViewAll={handleViewGoals}
                testID="pulse-goals"
              />
            ) : null}

            {state.recentActivity.length > 0 ? (
              <PulseRecentActivity
                activities={state.recentActivity}
                testID="pulse-recent-activity"
              />
            ) : null}
          </>
        )}

        {!state.profileComplete && !dismissed ? (
          <PulseProfileCompletion
            percentage={state.profileCompletionPercentage}
            startStep={state.lastIncompleteStep ?? undefined}
            testID="pulse-profile-completion"
          />
        ) : null}
      </ScrollView>

      {addSheetType && (
        <AddRecordSheet
          visible={addSheetVisible}
          title={ADD_SHEET_TITLES[addSheetType]}
          fields={ADD_SHEET_FIELDS[addSheetType]}
          onClose={closeAddSheet}
          onSubmit={handleAddSubmit}
          testID="pulse-add-record-sheet"
        />
      )}

      <PulseAddBottomSheet
        visible={moreVisible}
        actions={MORE_ACTIONS}
        onSelect={handleSheetSelect}
        onClose={() => setMoreVisible(false)}
        testID="pulse-more-sheet"
      />
    </SafeAreaView>
  )
}

function PulseSkeleton() {
  const { colors } = useTheme()
  const styles = useMemo(() => skeletonStyles(colors), [colors])

  return (
    <View style={styles.wrapper}>
      <View style={styles.title} />
      <View style={styles.subtitle} />
      <View style={styles.chipRow}>
        <View style={styles.chip} />
        <View style={styles.chip} />
        <View style={styles.chip} />
        <View style={styles.chip} />
      </View>
      <View style={styles.sectionTitle} />
      <View style={styles.row} />
      <View style={styles.row} />
      <View style={styles.row} />
      <View style={styles.row} />
      <View style={styles.row} />
      <View style={styles.row} />
    </View>
  )
}

const skeletonStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    title: {
      width: 100,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginBottom: 8,
    },
    subtitle: {
      width: 180,
      height: 18,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 20,
    },
    chipRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 28,
    },
    chip: {
      width: 100,
      height: 44,
      borderRadius: 16,
      backgroundColor: colors.border,
    },
    sectionTitle: {
      width: 100,
      height: 14,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    row: {
      height: 72,
      borderRadius: 16,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
  })

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingTop: 8,
      paddingBottom: 120,
    },
    sectionHeader: {
      paddingHorizontal: 20,
      marginTop: 28,
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    errorBanner: {
      marginHorizontal: 20,
      marginTop: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.dangerBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    errorText: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.danger,
      marginRight: 12,
    },
    retryButton: {
      paddingHorizontal: 14,
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
    welcomeCard: {
      marginHorizontal: 20,
      marginTop: 24,
      padding: 20,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    welcomeTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h3,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    welcomeBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  })
