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
import { AuthInput, PrimaryButton, SocialAuthRow } from '@/components/forms'
import { Typography } from '@/theme'

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

  const onSignInPress = async () => {
    if (!email || !password) return
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      console.error(err)
      alert('Login failed. Please check your credentials and try again.')
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
          minHeight: 44,
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

        <View style={styles.inputGroup}>
          <AuthInput
            leadingIcon={Mail}
            placeholder="name@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            testID="login-email-input"
          />
          <Pressable
            style={styles.forgotPasswordRow}
            onPress={() => console.log('Forgot password — Clerk placeholder')}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>
          <AuthInput
            leadingIcon={Lock}
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
            testID="login-password-input"
          />
        </View>

        <View style={styles.primaryButtonSpacing}>
          <PrimaryButton
            title="Sign In"
            onPress={onSignInPress}
            loading={loading}
            disabled={!email || !password}
            testID="login-sign-in-button"
          />
        </View>

        <SocialAuthRow onSocialPress={onSocialPress} />

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
