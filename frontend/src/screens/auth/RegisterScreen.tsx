import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { AuthService } from '@/services/AuthService'
import {
  AuthScreenWrapper,
  AuthHeader,
  AuthFooter,
  RegisterTrustBadges,
  RegisterAssurance,
} from '@/components/layout'
import { RegisterForm } from '@/components/forms'
import { Typography } from '@/theme'

// TODO: Clerk integration — import { useSignUp } from '@clerk/clerk-expo'
// const { signUp } = useSignUp()

interface RegisterScreenProps {
  navigation: {
    navigate: (screen: string) => void
    goBack: () => void
  }
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { colors } = useTheme()
  const { setToken } = useAuthContext()
  const [loading, setLoading] = useState(false)

  const onCreateAccountPress = async (data: {
    fullName: string
    email: string
    password: string
  }) => {
    setLoading(true)
    try {
      // TODO: Replace with Clerk signUp.create({ emailAddress: email, password })
      const result = await AuthService.register({
        email: data.email,
        password: data.password,
      })
      await setToken(result.access_token)
      // TODO: Clerk — await signUp.update({ firstName: data.fullName })
    } catch (err: unknown) {
      console.error(err)
      alert('Account creation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          flex: 1,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: 34,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 8,
          lineHeight: 40,
        },
        subtitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 32,
          paddingHorizontal: 8,
        },
        trustBadges: {
          gap: 12,
          marginBottom: 32,
        },
      }),
    [colors.textPrimary, colors.textSecondary]
  )

  return (
    <AuthScreenWrapper testID="register-screen">
      <View style={styles.content}>
        <AuthHeader onBack={() => navigation.goBack()} />

        <Text style={styles.title}>Start Your Financial Journey</Text>
        <Text style={styles.subtitle}>
          Join over 50,000 users building wealth with intelligent, automated
          financial planning tailored to your goals.
        </Text>

        <View style={styles.trustBadges}>
          <RegisterTrustBadges />
        </View>

        <RegisterForm loading={loading} onSubmit={onCreateAccountPress} />

        <RegisterAssurance />

        <AuthFooter />
      </View>
    </AuthScreenWrapper>
  )
}
