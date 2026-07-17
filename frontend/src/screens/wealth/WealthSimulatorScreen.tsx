import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Bell, Filter, User } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useWealthSimulator, type ScenarioKey } from '@/hooks/useWealthSimulator'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'

import { ParamSlider } from '@/components/wealth/ParamSlider'
import { ScenarioSelector } from '@/components/wealth/ScenarioSelector'
import { GalaxyChart } from '@/components/wealth/GalaxyChart'
import { AIRecommendationCard } from '@/components/wealth/AIRecommendationCard'
import { BreakdownCards } from '@/components/wealth/BreakdownCards'

const TREND_LABEL = '+240% vs Cash'

export default function WealthSimulatorScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = makeStyles(colors)

  const {
    sliders,
    scenarioCards,
    scenario,
    setScenario,
    setMonthlySavings,
    setAnnualHike,
    setInflation,
    setYears,
    projection,
    formatCurrency,
  } = useWealthSimulator()

  const sliderSetters: Record<string, (value: number) => void> = {
    'Monthly Savings': setMonthlySavings,
    'Annual Income Hike': setAnnualHike,
    'Expected Inflation': setInflation,
    'Years to Goal': setYears,
  }

  const handleScenarioSelect = (key: ScenarioKey) => {
    setScenario(key)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <Animated.View entering={FadeInUp.delay(0).springify()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <User size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.headerTitle}>Wealth Simulator</Text>
            </View>
            <Pressable
              style={styles.bellButton}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Bell size={22} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <Text style={styles.pageTitle}>What If Simulator</Text>
          <Text style={styles.pageSubtitle}>
            Visualize your future financial gravity by tuning savings, growth
            and time.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Growth Parameters</Text>
            <View style={styles.iconCircle}>
              <Filter size={18} color={colors.primary} strokeWidth={2} />
            </View>
          </View>

          {sliders.map((slider) => (
            <ParamSlider
              key={slider.label}
              label={slider.label}
              value={slider.value}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              displayValue={slider.format(slider.value)}
              onValueChange={sliderSetters[slider.label]}
            />
          ))}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>INVESTMENT SCENARIOS</Text>
          <ScenarioSelector
            scenarios={scenarioCards}
            activeKey={scenario}
            onSelect={handleScenarioSelect}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <GalaxyChart
            value={projection.projectedNetWorth}
            trendLabel={TREND_LABEL}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          style={styles.section}
        >
          <AIRecommendationCard onApply={() => {}} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={styles.section}
        >
          <BreakdownCards
            totalPrincipal={projection.totalPrincipal}
            estimatedReturns={projection.estimatedReturns}
            inflationImpact={projection.inflationImpact}
            formatter={formatCurrency}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    bellButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.heading,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    pageSubtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    cardTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
  })
}
