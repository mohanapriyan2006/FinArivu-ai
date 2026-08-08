import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Zap, ChevronRight } from 'lucide-react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { useTheme } from '@/contexts/ThemeContext'
import { Logo } from '@/components/layout'
import { AIGlow, FadeInUp, ScalePress } from '@/components/animation'
import { Typography } from '@/theme'

interface OnboardingScreenProps {
  navigation: {
    navigate: (screen: string) => void
  }
}

const TOTAL_STEPS = 3

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [activeIndex, setActiveIndex] = useState(0)

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        },
        skipButton: {
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: 8,
        },
        skipText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 20,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
        },
        chartRow: {
          flexDirection: 'row',
          gap: 16,
          alignItems: 'flex-end',
          height: 160,
        },
        barsContainer: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '100%',
        },
        bar: {
          width: 32,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        },
        aiPanel: {
          width: 96,
          height: '100%',
          borderRadius: 16,
          backgroundColor: colors.primaryBackground,
          alignItems: 'center',
          justifyContent: 'center',
        },
        aiPill: {
          width: 56,
          height: 32,
          borderRadius: 999,
          backgroundColor: colors.accent,
        },
        skeletons: {
          marginTop: 20,
          gap: 8,
        },
        skeleton: {
          height: 10,
          borderRadius: 999,
          backgroundColor: colors.border,
          opacity: 0.6,
        },
        badge: {
          position: 'absolute',
          top: 16,
          left: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          gap: 6,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        },
        badgeText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.bold,
          color: colors.primaryDark,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: 30,
          fontWeight: Typography.fontWeights.bold,
          color: colors.textPrimary,
          textAlign: 'center',
          marginTop: 40,
          lineHeight: 36,
        },
        subtitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 16,
          paddingHorizontal: 8,
          lineHeight: 24,
        },
        pagination: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginTop: 32,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          borderRadius: 16,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 4,
        },
        primaryButtonText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.surface,
        },
      }),
    [colors, insets.bottom, insets.top]
  )

  const handleContinue = () => {
    if (activeIndex < TOTAL_STEPS - 1) {
      setActiveIndex((prev) => prev + 1)
    } else {
      navigation.navigate('Auth')
    }
  }

  const handleSkip = () => {
    navigation.navigate('Auth')
  }

  const skeletonWidths = ['85%', '65%', '75%']

  return (
    <View style={styles.container} testID="onboarding-screen">
      <View style={styles.header}>
        <Logo size={40} testID="onboarding-logo" />
        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <FadeInUp delay={0}>
          <View style={styles.card} testID="onboarding-illustration">
            <View style={styles.chartRow}>
              <View style={styles.barsContainer}>
                <View style={[styles.bar, { height: '40%', backgroundColor: `${colors.primary}4D` }]} />
                <View style={[styles.bar, { height: '65%', backgroundColor: `${colors.primary}99` }]} />
                <View style={[styles.bar, { height: '85%', backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: '55%', backgroundColor: colors.primaryDark }]} />
              </View>

              <View style={styles.aiPanel}>
                <AIGlow testID="onboarding-ai-glow">
                  <View style={styles.aiPill} />
                </AIGlow>
              </View>
            </View>

            <View style={styles.skeletons}>
              {skeletonWidths.map((width, index) => (
                <View key={index} style={[styles.skeleton, { width: width as `${number}%` }]} />
              ))}
            </View>

            <AIGlow testID="onboarding-badge-glow">
              <View style={styles.badge}>
                <Zap size={12} color={colors.primaryDark} strokeWidth={2.5} />
                <Text style={styles.badgeText}>AI ANALYSIS READY</Text>
              </View>
            </AIGlow>
          </View>
        </FadeInUp>

        <FadeInUp delay={120}>
          <Text style={styles.title}>Know Your Financial Health</Text>
        </FadeInUp>

        <FadeInUp delay={200}>
          <Text style={styles.subtitle}>
            Understand where your money goes and how healthy your finances
            really are.
          </Text>
        </FadeInUp>

        <FadeInUp delay={280}>
          <View style={styles.pagination}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <PaginationDot
                key={index}
                active={index === activeIndex}
                activeColor={colors.primary}
                inactiveColor={colors.border}
              />
            ))}
          </View>
        </FadeInUp>
      </View>

      <FadeInUp delay={360}>
        <ScalePress
          onPress={handleContinue}
          testID="onboarding-continue-button"
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <View style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continue</Text>
            <ChevronRight size={18} color={colors.surface} strokeWidth={2.5} />
          </View>
        </ScalePress>
      </FadeInUp>
    </View>
  )
}

function PaginationDot({
  active,
  activeColor,
  inactiveColor,
}: {
  active: boolean
  activeColor: string
  inactiveColor: string
}) {
  const width = useSharedValue(active ? 24 : 8)

  useEffect(() => {
    width.value = withSpring(active ? 24 : 8, {
      damping: 20,
      stiffness: 200,
    })
  }, [active, width])

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }))

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 999,
          backgroundColor: active ? activeColor : inactiveColor,
        },
        animatedStyle,
      ]}
    />
  )
}
