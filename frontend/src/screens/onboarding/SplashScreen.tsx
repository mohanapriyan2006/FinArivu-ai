import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Lock, BarChart3, Sparkles, ChevronRight } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Logo } from '@/components/layout'
import { FadeInUp, ScalePress } from '@/components/animation'
import { Typography } from '@/theme'

interface SplashScreenProps {
  navigation: {
    navigate: (screen: string) => void
  }
}

const FEATURES = [
  { icon: Lock, label: 'Secure' },
  { icon: BarChart3, label: 'Smart Insights' },
  { icon: Sparkles, label: 'AI Powered' },
] as const

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

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
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        brand: {
          alignItems: 'center',
          marginBottom: 32,
        },
        brandTitle: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 16,
        },
        brandText: {
          fontFamily: Typography.fontFamily,
          fontSize: 24,
          fontWeight: Typography.fontWeights.bold,
          color: colors.textPrimary,
        },
        brandAccent: {
          fontFamily: Typography.fontFamily,
          fontSize: 24,
          fontWeight: Typography.fontWeights.bold,
          color: colors.primary,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: 30,
          fontWeight: Typography.fontWeights.bold,
          color: colors.textPrimary,
          textAlign: 'center',
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
        chips: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 12,
          marginTop: 32,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        chipLabel: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
          marginLeft: 8,
        },
        footer: {
          width: '100%',
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
        signInRow: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 20,
          minHeight: 44,
          paddingHorizontal: 16,
        },
        signInText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
        },
        signInLink: {
          color: colors.primary,
          fontWeight: Typography.fontWeights.semibold,
        },
        legalRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 24,
        },
        legalLink: {
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: 4,
          marginHorizontal: 8,
        },
        legalText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.medium,
          color: colors.textTertiary,
        },
      }),
    [colors, insets.bottom, insets.top]
  )

  return (
    <View style={styles.container} testID="splash-screen">
      <View style={styles.center}>
        <FadeInUp delay={0}>
          <View style={styles.brand}>
            <Logo size={80} testID="splash-logo" />
            <View style={styles.brandTitle}>
              <Text style={styles.brandText}>FinArivu</Text>
              <Text style={styles.brandAccent}>AI</Text>
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={80}>
          <Text style={styles.title}>Your AI Personal CFO</Text>
        </FadeInUp>

        <FadeInUp delay={160}>
          <Text style={styles.subtitle}>
            Track. Plan. Grow. Smart financial intelligence for modern
            professionals.
          </Text>
        </FadeInUp>

        <FadeInUp delay={240}>
          <View style={styles.chips}>
            {FEATURES.map(({ icon: Icon, label }, index) => (
              <View key={label} style={styles.chip} testID={`splash-feature-chip-${index}`}>
                <Icon size={16} color={colors.primary} strokeWidth={2} />
                <Text style={styles.chipLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </FadeInUp>
      </View>

      <View style={styles.footer}>
        <FadeInUp delay={320}>
          <ScalePress
            onPress={() => navigation.navigate('Onboarding')}
            testID="splash-get-started-button"
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <ChevronRight size={18} color={colors.surface} strokeWidth={2.5} />
            </View>
          </ScalePress>
        </FadeInUp>

        <FadeInUp delay={400}>
          <Pressable
            onPress={() => navigation.navigate('Auth')}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            style={styles.signInRow}
          >
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </Pressable>
        </FadeInUp>

        <FadeInUp delay={480}>
          <View style={styles.legalRow}>
            {['Privacy Policy', 'Terms of Service', 'Security Disclosure'].map(
              (label) => (
                <Pressable
                  key={label}
                  onPress={() => console.log(`${label} pressed`)}
                  accessibilityRole="link"
                  style={styles.legalLink}
                >
                  <Text style={styles.legalText}>{label}</Text>
                </Pressable>
              )
            )}
          </View>
        </FadeInUp>
      </View>
    </View>
  )
}
