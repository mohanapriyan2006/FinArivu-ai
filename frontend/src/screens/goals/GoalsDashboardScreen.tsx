import React, { useEffect, useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Animated, {
  FadeInUp,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, G } from 'react-native-svg'
import {
  Briefcase,
  Car,
  GraduationCap,
  Heart,
  Home,
  Lightbulb,
  MoreHorizontal,
  Plane,
  Plus,
  ShieldAlert,
  Sparkles,
} from 'lucide-react-native'

import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { CARD_SHADOW, ScreenHeader } from '@/components/insights/Common'
import { GoalCard } from '@/components/goals/GoalCard'
import { TimelineItem } from '@/components/goals/TimelineItem'
import type { RootStackParamList } from '@/navigation/AppNavigator'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface RingProps {
  progress: number
  size?: number
  strokeWidth?: number
  value: string
  label: string
}

function HeroRing({ progress, size = 180, strokeWidth = 16, value, label }: RingProps) {
  const { colors } = useTheme()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = useSharedValue(circumference)
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }))

  useEffect(() => {
    offset.value = withTiming(circumference * (1 - progress), { duration: 1400 })
  }, [circumference, offset, progress])

  const textStyles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        },
        value: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.display,
          fontWeight: Typography.fontWeights.bold,
          color: '#FFFFFF',
        },
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.semibold,
          color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 4,
        },
      }),
    []
  )

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View style={textStyles.overlay}>
        <Text style={textStyles.value}>{value}</Text>
        <Text style={textStyles.label}>{label}</Text>
      </View>
    </View>
  )
}

interface StatusPillProps {
  value: string
  label: string
  color: string
}

function StatusPill({ value, label, color }: StatusPillProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={styles.statusCard}>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  if (hour < 21) return 'Good Evening'
  return 'Good Night'
}

export default function GoalsDashboardScreen() {
  const { colors } = useTheme()
  const { user } = useAuthContext()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Mohan'
  const greeting = `${getGreeting()}, ${firstName}`

  const goals = useMemo(
    () => [
      {
        id: '1',
        icon: Home,
        iconBackgroundColor: colors.accentBackground,
        iconColor: colors.accent,
        title: 'Dream House',
        target: 'Target ₹20,00,000',
        current: '₹15.2L',
        progress: 0.75,
        status: 'On Track',
        statusColor: colors.success,
      },
      {
        id: '2',
        icon: Car,
        iconBackgroundColor: colors.primaryBackground,
        iconColor: colors.primary,
        title: 'New Car',
        target: 'Target ₹8,00,000',
        current: '₹4.5L',
        progress: 0.56,
        status: 'On Track',
        statusColor: colors.success,
      },
      {
        id: '3',
        icon: Plane,
        iconBackgroundColor: `${colors.warning}15`,
        iconColor: colors.warning,
        title: 'Europe Vacation',
        target: 'Target ₹5,00,000',
        current: '₹1.8L',
        progress: 0.36,
        status: 'Attention',
        statusColor: colors.warning,
      },
    ],
    [colors]
  )

  const timeline = useMemo(
    () => [
      { year: '2026', title: 'Started Emergency Fund', date: 'May 2026', dotColor: colors.success },
      { year: '2027', title: 'First Home Down Payment', date: 'March 2027', dotColor: colors.primary },
      { year: '2028', title: 'Europe Vacation Fund', date: 'August 2028', dotColor: colors.warning },
      { year: '2029', title: 'Dream House Completion', date: 'March 2029', dotColor: colors.accent },
    ],
    [colors]
  )

  const scale = useSharedValue(1)
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handleFabPressIn = () => {
    scale.value = withSpring(0.92)
  }

  const handleFabPressOut = () => {
    scale.value = withSpring(1)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(0).springify()}>
          <ScreenHeader
            title="Goals Dashboard"
            onBellPress={() => navigation.navigate('Notifications')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(50).springify()}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subGreeting}>You are building your future.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <View style={styles.heroCard}>
            <HeroRing progress={0.82} value="82%" label="LIFE PROGRESS" />
            <View style={styles.aiPill}>
              <View style={styles.aiPillIcon}>
                <Sparkles size={16} color={colors.accent} strokeWidth={2} />
              </View>
              <Text style={styles.aiPillText}>
                You are ahead of schedule on 2 goals.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goal Milestones</Text>
            <Pressable onPress={() => {}} accessibilityRole="button">
              <Text style={styles.sectionAction}>View All</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesScroll}
          >
            {goals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                icon={goal.icon}
                iconBackgroundColor={goal.iconBackgroundColor}
                iconColor={goal.iconColor}
                title={goal.title}
                target={goal.target}
                current={goal.current}
                progress={goal.progress}
                status={goal.status}
                statusColor={goal.statusColor}
                onPress={() => navigation.navigate('GoalJourney')}
                delay={index * 100}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <View style={styles.statusRow}>
            <StatusPill value="3" label="ON TRACK" color={colors.success} />
            <StatusPill value="1" label="ATTENTION" color={colors.warning} />
            <StatusPill value="2" label="DONE" color={colors.primary} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationIconBox}>
                <Lightbulb size={20} color={colors.accent} strokeWidth={2} />
              </View>
              <Text style={styles.recommendationTitle}>FinArivu Recommendation</Text>
            </View>
            <Text style={styles.recommendationBody}>
              You can reach your{' '}
              <Text style={{ color: colors.primary, fontWeight: Typography.fontWeights.bold }}>
                Home Goal
              </Text>{' '}
              <Text style={{ color: colors.success, fontWeight: Typography.fontWeights.bold }}>
                6 months earlier
              </Text>{' '}
              if you increase your monthly SIP by{' '}
              <Text style={{ color: colors.primary, fontWeight: Typography.fontWeights.bold }}>
                ₹5,000
              </Text>
              .
            </Text>
            <Pressable
              style={styles.recommendationButton}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <Text style={styles.recommendationButtonText}>Apply Optimization</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify()}>
          <Text style={styles.sectionTitle}>Future Timeline</Text>
          <View style={styles.timelineContainer}>
            {timeline.map((item, index) => (
              <TimelineItem
                key={item.year}
                year={item.year}
                title={item.title}
                date={item.date}
                dotColor={item.dotColor}
                isLast={index === timeline.length - 1}
                delay={index * 80}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(700).springify()}
        style={[
          styles.fab,
          fabStyle,
          { bottom: Math.max(insets.bottom, 16) + 24 },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate('CreateGoal')}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          style={styles.fabButton}
          accessibilityRole="button"
          accessibilityLabel="Create new goal"
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
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
      paddingTop: 16,
    },
    greeting: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subGreeting: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    heroCard: {
      backgroundColor: colors.heroCard,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
      ...CARD_SHADOW,
    },
    aiPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginTop: 20,
    },
    aiPillIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    aiPillText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    sectionAction: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    milestonesScroll: {
      paddingRight: 8,
      paddingBottom: 4,
    },
    statusRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statusCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      ...CARD_SHADOW,
    },
    statusValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      marginBottom: 4,
    },
    statusLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    recommendationCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      padding: 20,
      marginBottom: 24,
      ...CARD_SHADOW,
    },
    recommendationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    recommendationIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.accentBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendationTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    recommendationBody: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 16,
    },
    recommendationButton: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendationButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primaryDark,
    },
    timelineContainer: {
      marginTop: 8,
      marginBottom: 24,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
    },
    fabButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...CARD_SHADOW,
    },
  })
}
