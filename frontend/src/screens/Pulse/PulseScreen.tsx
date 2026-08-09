import { useMemo, useState } from 'react'
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

import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { usePulse } from '@/hooks/usePulse'
import { useTheme } from '@/contexts/ThemeContext'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { PulseAttentionItem, PulseFinanceItem, PulseQuickAction } from '@/screens/Pulse/types'
import { QUICK_ACTIONS, MORE_ACTIONS } from '@/screens/Pulse/pulseViewModel'

import { PulseHeader } from './components/PulseHeader'
import { PulseQuickActions } from './components/PulseQuickActions'
import { PulseAddBottomSheet } from './components/PulseAddBottomSheet'
import { PulseNeedsAttention } from './components/PulseNeedsAttention'
import { FinanceControlRow } from './components/FinanceControlRow'
import { PulseGoals } from './components/PulseGoals'
import { PulseRecentActivity } from './components/PulseRecentActivity'
import { PulseProfileCompletion } from './components/PulseProfileCompletion'

type PulseNavigationProp = StackNavigationProp<RootStackParamList>

export default function PulseScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<PulseNavigationProp>()
  const { dismissed } = useFinancialProfile()
  const { state, isLoading, error, refetch } = usePulse()

  const [moreVisible, setMoreVisible] = useState(false)
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
    navigation.navigate(action.route as keyof RootStackParamList, action.params as never)
  }

  const handleFinancePress = (item: PulseFinanceItem) => {
    if (item.routeStep) {
      navigation.navigate('FinancialProfileSetup', { startStep: item.routeStep })
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
