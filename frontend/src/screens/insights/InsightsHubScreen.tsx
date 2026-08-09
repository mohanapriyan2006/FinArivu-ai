import React, { useMemo } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Bell } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useInsights } from './useInsights'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import type { AttentionItem, TopInsight } from './types'

import { FinancialHealthHero } from './components/FinancialHealthHero'
import { TopInsightCard } from './components/TopInsightCard'
import { WeeklySummary } from './components/WeeklySummary'
import { TrendSection } from './components/TrendSection'
import { AttentionSection } from './components/AttentionSection'
import { PositiveInsights } from './components/PositiveInsights'
import { InsightsSkeleton } from './components/InsightsSkeleton'
import { InsightsEmptyState } from './components/InsightsEmptyState'
import { InsightsErrorState } from './components/InsightsErrorState'

type InsightsNavigationProp = StackNavigationProp<RootStackParamList>

export default function InsightsHubScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<InsightsNavigationProp>()
  const { state, isLoading, error, refetch } = useInsights()

  const styles = useMemo(() => makeStyles(colors), [colors])

  const handleHealthPress = () => {
    navigation.navigate('FinancialHealth')
  }

  const handleTopInsightPress = (insight: TopInsight) => {
    navigation.navigate(
      insight.route as keyof RootStackParamList,
      (insight.params as never) ?? undefined
    )
  }

  const handleAttentionPress = (item: AttentionItem) => {
    navigation.navigate(
      item.route as keyof RootStackParamList,
      (item.params as never) ?? undefined
    )
  }

  const handleCompleteProfile = () => {
    navigation.navigate('FinancialProfileSetup')
  }

  const handleAddExpense = () => {
    navigation.navigate('QuickAddExpense')
  }

  const handleNotifications = () => {
    navigation.navigate('Notifications')
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Insights</Text>
        <Pressable
          onPress={handleNotifications}
          style={styles.bellButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      {isLoading && !error ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          testID="insights-skeleton-scroll"
        >
          <InsightsSkeleton />
        </ScrollView>
      ) : error ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          testID="insights-error-scroll"
        >
          <InsightsErrorState
            message={error}
            onRetry={refetch}
            testID="insights-error"
          />
        </ScrollView>
      ) : state.isNewUser ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          testID="insights-empty-scroll"
        >
          <InsightsEmptyState
            onCompleteProfile={handleCompleteProfile}
            onAddExpense={handleAddExpense}
            testID="insights-empty"
          />
        </ScrollView>
      ) : (
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
          testID="insights-screen"
        >
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your financial picture at a glance
          </Text>

          <FinancialHealthHero
            score={state.healthScore}
            status={state.healthStatus}
            factors={state.healthFactors}
            explanation={state.healthExplanation}
            onPress={handleHealthPress}
          />

          {state.topInsight ? (
            <TopInsightCard
              insight={state.topInsight}
              onPress={() => handleTopInsightPress(state.topInsight!)}
              testID="insights-top-insight"
            />
          ) : null}

          {state.weeklySummary ? (
            <WeeklySummary
              metrics={state.weeklySummary}
              testID="insights-weekly-summary"
            />
          ) : null}

          {state.trends.length > 0 ? (
            <TrendSection
              trends={state.trends}
              testID="insights-trends"
            />
          ) : null}

          {state.attentionItems.length > 0 ? (
            <AttentionSection
              items={state.attentionItems}
              onPress={handleAttentionPress}
              testID="insights-attention"
            />
          ) : null}

          {state.positiveItems.length > 0 ? (
            <PositiveInsights
              items={state.positiveItems}
              testID="insights-positive"
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
    },
    bellButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingTop: 4,
    },
    subtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.medium,
      textAlign: 'center',
      marginBottom: 4,
    },
  })
