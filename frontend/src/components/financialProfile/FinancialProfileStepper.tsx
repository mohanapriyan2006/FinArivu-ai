import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ChevronLeft, X } from 'lucide-react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/ThemeContext'
import { PrimaryButton } from '@/components/forms'
import { ProfileProgressBar } from './ProfileProgressBar'
import { Typography } from '@/theme'

interface FinancialProfileStepperProps {
  currentStepIndex: number
  totalSteps: number
  stepTitle: string
  title: string
  subtitle?: string
  canContinue: boolean
  onBack: () => void
  onContinue: () => void
  onSkip?: () => void
  onExit?: () => void
  continueTitle?: string
  skipTitle?: string
  children: React.ReactNode
  testID?: string
}

export function FinancialProfileStepper({
  currentStepIndex,
  totalSteps,
  stepTitle,
  title,
  subtitle,
  canContinue,
  onBack,
  onContinue,
  onSkip,
  onExit,
  continueTitle = 'Continue',
  skipTitle = 'Skip for now',
  children,
  testID,
}: FinancialProfileStepperProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const styles = useMemo(
    () =>
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
          paddingTop: 12,
          paddingBottom: 12,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
        },
        spacer: {
          width: 44,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 24) + 140,
        },
        progressRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        },
        stepCounter: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        progressBar: {
          flex: 1,
          marginLeft: 12,
        },
        sectionTitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.bold,
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: 28,
          fontWeight: Typography.fontWeights.bold,
          color: colors.textPrimary,
          lineHeight: 34,
          marginBottom: 8,
        },
        subtitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          lineHeight: 22,
          marginBottom: 32,
        },
        footer: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 20) + 12,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        skipButton: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
          marginTop: 12,
        },
        skipText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
        },
      }),
    [colors, insets.bottom]
  )

  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID={testID}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID={testID ? `${testID}-back` : undefined}
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Financial Profile</Text>
        {onExit ? (
          <Pressable
            onPress={onExit}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Exit setup"
            testID={testID ? `${testID}-exit` : undefined}
          >
            <X size={22} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressRow}>
          <Text style={styles.stepCounter}>
            {currentStepIndex + 1} of {totalSteps}
          </Text>
          <View style={styles.progressBar}>
            <ProfileProgressBar percentage={progressPercentage} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{stepTitle}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {children}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={continueTitle}
          onPress={onContinue}
          disabled={!canContinue}
          testID={testID ? `${testID}-continue` : undefined}
        />
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel={skipTitle}
            testID={testID ? `${testID}-skip` : undefined}
          >
            <Text style={styles.skipText}>{skipTitle}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  )
}
