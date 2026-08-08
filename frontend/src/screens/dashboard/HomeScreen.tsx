import React, { useMemo, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useWindowDimensions,
  Pressable,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import {
  Landmark,
  TrendingUp,
  CreditCard,
  Banknote,
  RefreshCw,
} from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { CompletionCard } from '@/components/financialProfile/CompletionCard'
import { PROFILE_COMPLETION_THRESHOLD } from '@/utils/profileCompletion'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import { Typography } from '@/theme'

interface WaveBackgroundProps {
  isDark: boolean
  colors: any
}

// 1. AnimatedWaveBackground Component (Performance Optimized for Android)
const AnimatedWaveBackground: React.FC<WaveBackgroundProps> = ({ isDark }) => {
  const { width, height } = useWindowDimensions()
  const translateX1 = useSharedValue(0)
  const translateX2 = useSharedValue(0)

  useEffect(() => {
    translateX1.value = 0
    translateX2.value = 0

    // Smooth translation running on the UI thread (60 FPS)
    translateX1.value = withRepeat(
      withTiming(-width, {
        duration: 24000,
        easing: Easing.linear,
      }),
      -1,
      false
    )

    translateX2.value = withRepeat(
      withTiming(-width, {
        duration: 16000,
        easing: Easing.linear,
      }),
      -1,
      false
    )
  }, [width])

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX1.value }],
  }))

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX2.value }],
  }))

  const bgBase = isDark ? '#0B1220' : '#F8FAFC'

  // Dynamic wave colors using transparent overlays of indigo primary
  const wave1Color = isDark
    ? 'rgba(79, 70, 229, 0.12)' // 12% opacity primary indigo accent
    : 'rgba(79, 70, 229, 0.05)' // 5% opacity for clean light mode

  const wave2Color = isDark
    ? 'rgba(79, 70, 229, 0.06)'
    : 'rgba(79, 70, 229, 0.02)'

  // Generates smooth periodic sine wave paths that repeat seamlessly
  const path1 = useMemo(() => {
    const w = width * 2
    const h = height
    const offset = h * 0.4
    const amplitude = 32
    const points = []
    const segments = 40
    const step = w / segments
    for (let i = 0; i <= segments; i += 1) {
      const x = i * step
      const y = offset + Math.sin((i / segments) * Math.PI * 4) * amplitude
      points.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return `M 0 ${h} L 0 ${offset} ${points.map((p) => `L ${p}`).join(' ')} L ${w} ${h} Z`
  }, [width, height])

  const path2 = useMemo(() => {
    const w = width * 2
    const h = height
    const offset = h * 0.48
    const amplitude = 20
    const points = []
    const segments = 40
    const step = w / segments
    for (let i = 0; i <= segments; i += 1) {
      const x = i * step
      const y = offset + Math.cos((i / segments) * Math.PI * 4) * amplitude
      points.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return `M 0 ${h} L 0 ${offset} ${points.map((p) => `L ${p}`).join(' ')} L ${w} ${h} Z`
  }, [width, height])

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: bgBase }]}>
      {/* Wave Layer 1 */}
      <Animated.View
        style={[styles.waveContainer, animatedStyle1, { width: width * 2 }]}
      >
        <Svg width={width * 2} height={height}>
          <Path d={path1} fill={wave1Color} />
        </Svg>
      </Animated.View>

      {/* Wave Layer 2 */}
      <Animated.View
        style={[styles.waveContainer, animatedStyle2, { width: width * 2 }]}
      >
        <Svg width={width * 2} height={height}>
          <Path d={path2} fill={wave2Color} />
        </Svg>
      </Animated.View>
    </View>
  )
}

interface GlassCardProps {
  children: React.ReactNode
  style?: any
  isDark: boolean
}

// 2. GlassCard Reusable Component using expo-blur
const GlassCard: React.FC<GlassCardProps> = ({ children, style, isDark }) => {
  return (
    <View
      style={[
        styles.glassContainer,
        isDark ? styles.glassContainerDark : styles.glassContainerLight,
        style,
      ]}
    >
      <BlurView
        intensity={isDark ? 35 : 55}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardPadding}>{children}</View>
    </View>
  )
}

interface CardData {
  id: string
  title: string
  label: 'Assets' | 'Liabilities'
  value: string
  subtitle: string
  icon: React.ComponentType<any>
  subtitleColorType: 'primary' | 'success' | 'muted'
}

// Updated data set for Indian context
const CARDS_DATA: CardData[] = [
  {
    id: 'checking',
    title: 'Checking',
    label: 'Assets',
    value: '₹45,200.00',
    subtitle: 'Primary Account',
    icon: Landmark,
    subtitleColorType: 'primary',
  },
  {
    id: 'investments',
    title: 'Investments',
    label: 'Assets',
    value: '₹1,24,500.00',
    subtitle: '+12.5% this week',
    icon: TrendingUp,
    subtitleColorType: 'success',
  },
  {
    id: 'credit_cards',
    title: 'Credit Cards',
    label: 'Liabilities',
    value: '-₹4,250.00',
    subtitle: 'Next payment in 4 days',
    icon: CreditCard,
    subtitleColorType: 'muted',
  },
  {
    id: 'loan',
    title: 'Loan',
    label: 'Liabilities',
    value: '-₹4,85,000.00',
    subtitle: '3.2% Fixed Rate',
    icon: Banknote,
    subtitleColorType: 'muted',
  },
]

// 3. HomeScreen Component
export default function HomeScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { completion, dismissed, dismissPrompt, resumeStep } = useFinancialProfile()

  const heroValue = useMemo(
    () => ({
      currency: '₹',
      integer: '14,28,950',
      decimal: '.00',
    }),
    []
  )

  const renderCardItem = (card: CardData) => {
    const IconComponent = card.icon

    // Define subtitle color based on dynamic theme and specification
    let subtitleColor = colors.textSecondary
    if (card.subtitleColorType === 'primary') {
      subtitleColor = '#4F46E5' // Primary Indigo
    } else if (card.subtitleColorType === 'success') {
      subtitleColor = '#22C55E' // Success Green
    } else if (card.subtitleColorType === 'muted') {
      subtitleColor = colors.textSecondary
    }

    return (
      <GlassCard key={card.id} isDark={isDark} style={styles.cardSpacing}>
        {/* Top Row */}
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? 'rgba(79, 70, 229, 0.12)'
                  : 'rgba(79, 70, 229, 0.08)',
              },
            ]}
          >
            <IconComponent size={20} color="#4F46E5" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {card.title}
          </Text>
          <View style={styles.cardTopRight}>
            <Text style={[styles.cardTypeLabel, { color: colors.textSecondary }]}>
              {card.label}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.refreshButtonPressed,
              ]}
              onPress={() => {
                // Micro-feedback action can go here
              }}
              hitSlop={8}
            >
              <RefreshCw size={14} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Middle Row */}
        <Text style={[styles.cardAmount, { color: colors.textPrimary }]}>
          {card.value}
        </Text>

        {/* Bottom Row */}
        <Text style={[styles.cardSubtitle, { color: subtitleColor }]}>
          {card.subtitle}
        </Text>
      </GlassCard>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      <AnimatedWaveBackground isDark={isDark} colors={colors} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 }, // Safe bottom padding
          ]}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text
              style={[
                styles.heroSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              CURRENT PORTFOLIO VALUE
            </Text>
            <View style={styles.heroValueRow}>
              <Text
                style={[styles.heroValueMain, { color: colors.textPrimary }]}
              >
                {heroValue.currency}
                {heroValue.integer}
              </Text>
              <Text
                style={[
                  styles.heroValueDecimal,
                  { color: colors.textPrimary, opacity: 0.5 },
                ]}
              >
                {heroValue.decimal}
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.pillBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(79, 70, 229, 0.16)'
                      : 'rgba(79, 70, 229, 0.08)',
                  },
                ]}
              >
                <Text style={styles.pillBadgeText}>📈 +2.4% Today</Text>
              </View>
            </View>
          </View>

          {completion.percentage < PROFILE_COMPLETION_THRESHOLD && !dismissed ? (
            <View style={styles.completionCardContainer}>
              <CompletionCard
                percentage={completion.percentage}
                onContinue={() =>
                  navigation.navigate('FinancialProfileSetup', {
                    startStep: completion.lastIncompleteSection ?? resumeStep,
                  })
                }
                onDismiss={dismissPrompt}
              />
            </View>
          ) : null}

          {/* Cards Section */}
          <View style={styles.cardsSection}>
            {CARDS_DATA.map((card) => renderCardItem(card))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  waveContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 24, // Strict spacing scale
    paddingTop: 24,
  },
  // Hero Section Styling
  heroSection: {
    alignItems: 'center',
    marginVertical: 24, // Strict spacing scale
  },
  heroSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12, // Strict spacing scale
  },
  heroValueMain: {
    fontFamily: Typography.fontFamily,
    fontSize: 40,
    fontWeight: Typography.fontWeights.bold,
  },
  heroValueDecimal: {
    fontFamily: Typography.fontFamily,
    fontSize: 24,
    fontWeight: Typography.fontWeights.bold,
  },
  badgeContainer: {
    marginTop: 12, // Strict spacing scale
    alignItems: 'center',
  },
  pillBadge: {
    paddingHorizontal: 12, // Strict spacing scale
    paddingVertical: 4, // Strict spacing scale
    borderRadius: 9999,
  },
  pillBadgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: Typography.fontWeights.semibold,
    color: '#4F46E5', // Primary Indigo
  },
  // Cards Section Styling
  cardsSection: {
    marginTop: 12, // Strict spacing scale
  },
  completionCardContainer: {
    marginHorizontal: -4,
    marginTop: 8,
  },
  glassContainer: {
    borderRadius: 24, // Strict spacing scale
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassContainerLight: {
    borderColor: 'rgba(135, 135, 135, 0.37)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    
  },
  glassContainerDark: {
    borderColor: 'rgba(255, 255, 255, 0.37)',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    
  },
  cardPadding: {
    padding: 20, // Strict spacing scale
  },
  cardSpacing: {
    marginBottom: 16, // Strict spacing scale
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48, // Strict spacing scale (6 * 8)
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 16,
    fontWeight: Typography.fontWeights.semibold,
    marginLeft: 12, // Strict spacing scale
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  cardTypeLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: Typography.fontWeights.medium,
  },
  refreshButton: {
    marginLeft: 8, // Strict spacing scale
    padding: 4, // Strict spacing scale
  },
  refreshButtonPressed: {
    opacity: 0.6,
  },
  cardAmount: {
    fontFamily: Typography.fontFamily,
    fontSize: 24,
    fontWeight: Typography.fontWeights.bold,
    marginTop: 16, // Strict spacing scale
  },
  cardSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 13, // Pixel-perfect subtitle font size
    fontWeight: Typography.fontWeights.medium,
    marginTop: 8, // Strict spacing scale
  },
})
