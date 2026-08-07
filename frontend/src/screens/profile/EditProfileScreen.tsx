import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  DollarSign,
  User,
  UserCheck,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { ProfileService, type Profile } from '@/services/ProfileService'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required').optional().or(z.literal('')),
  age: z.number().min(18, 'Min age 18').max(100, 'Max age 100').optional(),
  city: z.string().optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  monthlyIncome: z.number().min(0, 'Must be positive').optional(),
  retirementAge: z.number().min(40, 'Min retirement age 40').max(80, 'Max retirement age 80').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const resolver = zodResolver(profileSchema) as Resolver<ProfileForm>

export default function EditProfileScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { getToken } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const styles = makeStyles(colors)

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
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [getToken, reset])

  const onSubmit = async (formData: ProfileForm) => {
    setSaving(true)
    setSaveSuccess(false)
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
      await ProfileService.updateProfile(payload, token)
      setSaveSuccess(true)
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack()
        }
      }, 800)
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Personal Information</Text>

          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
          </View>

          {/* Age */}
          <View style={styles.field}>
            <Text style={styles.label}>Age (Years)</Text>
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Calendar size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 28"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={value !== undefined ? String(value) : ''}
                    onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}
          </View>

          {/* City */}
          <View style={styles.field}>
            <Text style={styles.label}>City / Region</Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bengaluru"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
          </View>

          {/* Occupation */}
          <View style={styles.field}>
            <Text style={styles.label}>Occupation</Text>
            <Controller
              control={control}
              name="occupation"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Briefcase size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Senior Software Engineer"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
          </View>
        </View>

        {/* Financial Preferences Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Financial Parameters</Text>

          {/* Monthly Income */}
          <View style={styles.field}>
            <Text style={styles.label}>Monthly Net Income (₹)</Text>
            <Controller
              control={control}
              name="monthlyIncome"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <DollarSign size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 150000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={value !== undefined ? String(value) : ''}
                    onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.monthlyIncome && (
              <Text style={styles.errorText}>{errors.monthlyIncome.message}</Text>
            )}
          </View>

          {/* Retirement Age */}
          <View style={styles.field}>
            <Text style={styles.label}>Target Retirement Age</Text>
            <Controller
              control={control}
              name="retirementAge"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <UserCheck size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 55"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={value !== undefined ? String(value) : ''}
                    onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.retirementAge && (
              <Text style={styles.errorText}>{errors.retirementAge.message}</Text>
            )}
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, saveSuccess && styles.saveSuccessButton]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>
              {saveSuccess ? '✓ Saved Successfully' : 'Save Changes'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 18,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },

    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    formSectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    field: {
      marginBottom: 14,
    },
    label: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 48,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textPrimary,
    },
    errorText: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      color: colors.danger,
      marginTop: 4,
    },

    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    saveSuccessButton: {
      backgroundColor: colors.success,
    },
    saveButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: 16,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
}
