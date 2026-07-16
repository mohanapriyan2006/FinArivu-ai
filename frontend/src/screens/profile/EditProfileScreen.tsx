import { useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { ProfileService } from '@/services/ProfileService'
import type { Profile } from '@/services/ProfileService'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required').optional().or(z.literal('')),
  age: z.number().min(18, 'Min 18').max(100, 'Max 100').optional(),
  city: z.string().optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  monthlyIncome: z.number().min(0, 'Must be >= 0').optional(),
  retirementAge: z.number().min(40, 'Min 40').max(80, 'Max 80').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const resolver = zodResolver(profileSchema) as Resolver<ProfileForm>

export default function EditProfileScreen() {
  const { colors } = useTheme()
  const { logout, getToken } = useAuthContext()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver,
    defaultValues: {
      fullName: '',
      age: undefined,
      city: '',
      occupation: '',
      monthlyIncome: undefined,
      retirementAge: undefined,
    },
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await getToken()
        const data = await ProfileService.getProfile(token)
        setProfile(data)
        if (data) {
          reset({
            fullName: data.fullName || '',
            age: data.age ?? undefined,
            city: data.city || '',
            occupation: data.occupation || '',
            monthlyIncome: data.monthlyIncome ? Number(data.monthlyIncome) : undefined,
            retirementAge: data.retirementAge ?? undefined,
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [getToken, reset])

  const onSubmit = async (formData: ProfileForm) => {
    setSaving(true)
    try {
      const token = await getToken()
      const payload = {
        fullName: formData.fullName || undefined,
        age: formData.age ?? undefined,
        city: formData.city || undefined,
        occupation: formData.occupation || undefined,
        monthlyIncome: formData.monthlyIncome ?? undefined,
        retirementAge: formData.retirementAge ?? undefined,
      }
      const updated = await ProfileService.updateProfile(payload, token)
      setProfile(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const styles = makeStyles(colors)

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Age</Text>
        <Controller
          control={control}
          name="age"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="18-100"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(text ? Number(text) : undefined)}
              onBlur={onBlur}
            />
          )}
        />
        {errors.age && <Text style={styles.error}>{errors.age.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>City</Text>
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter your city"
              placeholderTextColor={colors.textSecondary}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Occupation</Text>
        <Controller
          control={control}
          name="occupation"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter your occupation"
              placeholderTextColor={colors.textSecondary}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Monthly Income</Text>
        <Controller
          control={control}
          name="monthlyIncome"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(text ? Number(text) : undefined)}
              onBlur={onBlur}
            />
          )}
        />
        {errors.monthlyIncome && <Text style={styles.error}>{errors.monthlyIncome.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Retirement Age</Text>
        <Controller
          control={control}
          name="retirementAge"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="40-80"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(text ? Number(text) : undefined)}
              onBlur={onBlur}
            />
          )}
        />
        {errors.retirementAge && <Text style={styles.error}>{errors.retirementAge.message}</Text>}
      </View>

      <Pressable style={styles.saveButton} onPress={handleSubmit(onSubmit)} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  )
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: 20,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 24,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
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
    },
    error: {
      color: colors.danger,
      fontSize: 12,
      marginTop: 4,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    logoutButton: {
      backgroundColor: colors.danger,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  })
}
