import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Mail, Lock, User, Check } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from '@/utils/validation'
import { AuthInput } from './AuthInput'
import { ArrowPrimaryButton } from './PrimaryButton'

interface RegisterFormProps {
  loading: boolean
  onSubmit: (data: {
    fullName: string
    email: string
    password: string
  }) => void
  testID?: string
}

type Field = 'fullName' | 'email' | 'password' | 'confirmPassword'
type FieldErrors = Partial<Record<Field, string | null>>

export function RegisterForm({ loading, onSubmit, testID }: RegisterFormProps) {
  const { colors } = useTheme()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [agreedError, setAgreedError] = useState<string | null>(null)

  const setFieldError = (field: Field, message: string | null) =>
    setErrors((prev) => ({ ...prev, [field]: message }))

  const handleSubmit = () => {
    const next: FieldErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    }
    setErrors(next)
    setAgreedError(agreed ? null : 'You must agree to the Terms of Service and Privacy Policy')
    if (Object.values(next).some(Boolean) || !agreed) return
    onSubmit({ fullName: fullName.trim(), email: email.trim(), password })
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        formSection: {
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 24,
          marginBottom: 24,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        formTitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xl,
          fontWeight: Typography.fontWeights.bold,
          color: colors.textPrimary,
          marginBottom: 4,
        },
        formSubtitle: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          marginBottom: 24,
        },
        inputGroup: {
          gap: 16,
        },
        checkboxRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 20,
          minHeight: 44,
        },
        checkbox: {
          width: 20,
          height: 20,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: agreed ? colors.primary : colors.surface,
        },
        checkboxLabel: {
          flex: 1,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.regular,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        link: {
          color: colors.primary,
          fontWeight: Typography.fontWeights.semibold,
        },
        primaryButtonSpacing: {
          marginTop: 24,
        },
        agreedErrorText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.regular,
          color: colors.danger,
          marginTop: 6,
          marginLeft: 32,
        },
      }),
    [
      agreed,
      colors.border,
      colors.primary,
      colors.shadowColor,
      colors.surface,
      colors.danger,
      colors.textPrimary,
      colors.textSecondary,
    ]
  )

  return (
    <View style={styles.formSection} testID={testID}>
      <Text style={styles.formTitle}>Create your FinArivu account.</Text>
      <Text style={styles.formSubtitle}>
        Ready to master your finances? Let&apos;s get started.
      </Text>

      <View style={styles.inputGroup}>
        <AuthInput
          leadingIcon={User}
          placeholder="e.g. John Doe"
          autoComplete="name"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text)
            if (errors.fullName) setFieldError('fullName', null)
          }}
          onBlur={() => fullName && setFieldError('fullName', validateFullName(fullName))}
          error={errors.fullName}
          testID="register-full-name-input"
        />
        <AuthInput
          leadingIcon={Mail}
          placeholder="name@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={(text) => {
            setEmail(text)
            if (errors.email) setFieldError('email', null)
          }}
          onBlur={() => email && setFieldError('email', validateEmail(email))}
          error={errors.email}
          testID="register-email-input"
        />
        <AuthInput
          leadingIcon={Lock}
          placeholder="Min. 8 chars, letters + numbers"
          isPassword
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            if (errors.password) setFieldError('password', null)
          }}
          onBlur={() => password && setFieldError('password', validatePassword(password))}
          error={errors.password}
          testID="register-password-input"
        />
        <AuthInput
          leadingIcon={Lock}
          placeholder="Confirm password"
          isPassword
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text)
            if (errors.confirmPassword) setFieldError('confirmPassword', null)
          }}
          onBlur={() =>
            confirmPassword &&
            setFieldError('confirmPassword', validateConfirmPassword(password, confirmPassword))
          }
          error={errors.confirmPassword}
          testID="register-confirm-password-input"
        />
      </View>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => {
          setAgreed((prev) => !prev)
          if (agreedError) setAgreedError(null)
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        accessibilityLabel="Agree to Terms of Service and Privacy Policy"
      >
        <View style={styles.checkbox}>
          {agreed && <Check size={14} color={colors.surface} strokeWidth={3} />}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </Pressable>
      {agreedError && (
        <Text style={styles.agreedErrorText} testID="register-agree-error">
          {agreedError}
        </Text>
      )}

      <View style={styles.primaryButtonSpacing}>
        <ArrowPrimaryButton
          title="Create Account"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          testID="register-create-account-button"
        />
      </View>
    </View>
  )
}
