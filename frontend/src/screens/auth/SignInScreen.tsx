import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { useState } from 'react'

import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { AuthService } from '@/services/AuthService'

export default function SignInScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme()
  const { setToken } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSignInPress = async () => {
    if (!email || !password) return
    setLoading(true)
    try {
      const result = await AuthService.login({ email, password })
      await setToken(result.access_token)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const styles = makeStyles(colors)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={onSignInPress} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </Pressable>
    </View>
  )
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      marginBottom: 16,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    link: {
      color: colors.primary,
      fontSize: 14,
      textAlign: 'center',
    },
  })
}
