import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Mail, Lock } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  AuthScreenWrapper,
  AuthHeader,
  AuthPrompt,
  AuthFooter,
  SecurityBadge,
} from '@/components/layout'
import { AuthErrorBanner, AuthInput, PrimaryButton, SocialAuthRow } from '@/components/forms'
import { Typography } from '@/theme'
import { getErrorMessage } from '@/utils/errors'
import { validateEmail, validateLoginPassword } from '@/utils/validation'

interface LoginScreenProps {
  navigation: {
    navigate: (screen: string) => void
    goBack: () => void
  }
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors } = useTheme()
  const { login } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const onSignInPress = async () => {
    const emailErr = validateEmail(email)
    const passwordErr = validateLoginPassword(password)
    setEmailError(emailErr)
    setPasswordError(passwordErr)
    setFormError(null)
    if (emailErr || passwordErr) return

    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err: unknown) {
      console.error(err)
      setFormError(getErrorMessage(err, 'Login failed. Please check your credentials and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const onSocialPress = (provider: 'google' | 'apple') => {
    console.log(`Social sign in with ${provider} — Clerk placeholder`)
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          flex: 1,
          paddingTop: 24,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: 28,
          fontWeight: Typography.fontWeights.bold,
          color: colors.textPrimary,
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 8,
        },
        subtitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 32,
        },
        inputGroup: {
          gap: 16,
        },
        forgotPasswordRow: {
          alignSelf: 'flex-end',
          marginTop: 4,
          marginBottom: 4,
          justifyContent: 'center',
          paddingHorizontal: 8,
        },
        forgotPasswordText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.primary,
        },
        primaryButtonSpacing: {
          marginTop: 16,
        },
        securityBadgeSpacing: {
          marginTop: 'auto',
          paddingTop: 24,
        },
      }),
    [colors.primary, colors.textPrimary, colors.textSecondary]
  )

  return (
    <AuthScreenWrapper testID="login-screen">
      <View style={styles.content}>
        <AuthHeader onBack={() => navigation.goBack()} />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your financial dashboard.
        </Text>

        <AuthErrorBanner message={formError} testID="login-error-banner" />

        <View style={styles.inputGroup}>
          <AuthInput
            leadingIcon={Mail}
            placeholder="name@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              if (emailError) setEmailError(null)
              if (formError) setFormError(null)
            }}
            onBlur={() => email && setEmailError(validateEmail(email))}
            error={emailError}
            testID="login-email-input"
          />

          <AuthInput
            leadingIcon={Lock}
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (passwordError) setPasswordError(null)
              if (formError) setFormError(null)
            }}
            error={passwordError}
            testID="login-password-input"
          />
        </View>

        <Pressable
            style={styles.forgotPasswordRow}
            onPress={() => console.log('Forgot password — Clerk placeholder')}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

        <View style={styles.primaryButtonSpacing}>
          <PrimaryButton
            title="Sign In"
            onPress={onSignInPress}
            loading={loading}
            disabled={!email || !password || loading}
            testID="login-sign-in-button"
          />
        </View>

        <AuthPrompt
          message="Don't have an account?"
          action="Create Account"
          onPress={() => navigation.navigate('Register')}
        />

        <View style={styles.securityBadgeSpacing}>
          <SecurityBadge text="Your financial data is encrypted and protected." />
        </View>

        <AuthFooter />
      </View>
    </AuthScreenWrapper>
  )
}
