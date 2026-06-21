import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@clerk/clerk-expo'

import { useTheme } from '@/contexts/ThemeContext'
import { ProfileService } from '@/services/ProfileService'

const step1Schema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(18, 'Min 18').max(100, 'Max 100'),
  city: z.string().min(1, 'City is required'),
})

const step2Schema = z.object({
  monthlyIncome: z.coerce.number().min(0, 'Must be >= 0'),
  occupation: z.string().min(1, 'Occupation is required'),
})

const step3Schema = z.object({
  retirementAge: z.coerce.number().min(40, 'Min 40').max(80, 'Max 80'),
})

type Step1Form = z.infer<typeof step1Schema>
type Step2Form = z.infer<typeof step2Schema>
type Step3Form = z.infer<typeof step3Schema>

type OnboardingData = Step1Form & Step2Form & Step3Form

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme()
  const { getToken } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<OnboardingData>>({})
  const [saving, setSaving] = useState(false)
  const styles = makeStyles(colors)

  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { fullName: '', age: undefined, city: '' },
  })

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: { monthlyIncome: undefined, occupation: '' },
  })

  const step3Form = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: { retirementAge: undefined },
  })

  const onStep1Next = (data: Step1Form) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(2)
  }

  const onStep2Next = (data: Step2Form) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(3)
  }

  const onStep3Submit = async (data: Step3Form) => {
    const allData = { ...formData, ...data } as OnboardingData
    setSaving(true)
    try {
      const token = await getToken()
      await ProfileService.saveProfile(
        {
          fullName: allData.fullName,
          age: allData.age,
          city: allData.city,
          occupation: allData.occupation,
          monthlyIncome: allData.monthlyIncome,
          retirementAge: allData.retirementAge,
        },
        token
      )
      navigation.replace('Main')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const StepIndicator = () => (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive]}>
          <Text style={[styles.stepText, step === s && styles.stepTextActive]}>{s}</Text>
        </View>
      ))}
    </View>
  )

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Personal Details</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <Controller
          control={step1Form.control}
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
        {step1Form.formState.errors.fullName && (
          <Text style={styles.error}>{step1Form.formState.errors.fullName.message}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Age</Text>
        <Controller
          control={step1Form.control}
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
        {step1Form.formState.errors.age && (
          <Text style={styles.error}>{step1Form.formState.errors.age.message}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>City</Text>
        <Controller
          control={step1Form.control}
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
        {step1Form.formState.errors.city && (
          <Text style={styles.error}>{step1Form.formState.errors.city.message}</Text>
        )}
      </View>

      <Pressable style={styles.nextButton} onPress={step1Form.handleSubmit(onStep1Next)}>
        <Text style={styles.nextButtonText}>Next</Text>
      </Pressable>
    </View>
  )

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Income Details</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Monthly Income</Text>
        <Controller
          control={step2Form.control}
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
        {step2Form.formState.errors.monthlyIncome && (
          <Text style={styles.error}>{step2Form.formState.errors.monthlyIncome.message}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Occupation</Text>
        <Controller
          control={step2Form.control}
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
        {step2Form.formState.errors.occupation && (
          <Text style={styles.error}>{step2Form.formState.errors.occupation.message}</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.backButton} onPress={() => setStep(1)}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={step2Form.handleSubmit(onStep2Next)}>
          <Text style={styles.nextButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  )

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Future Planning</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Retirement Age</Text>
        <Controller
          control={step3Form.control}
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
        {step3Form.formState.errors.retirementAge && (
          <Text style={styles.error}>{step3Form.formState.errors.retirementAge.message}</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.backButton} onPress={() => setStep(2)}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={step3Form.handleSubmit(onStep3Submit)} disabled={saving}>
          <Text style={styles.nextButtonText}>{saving ? 'Saving...' : 'Finish'}</Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to FinArivu</Text>
      <StepIndicator />
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
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
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 24,
      textAlign: 'center',
    },
    stepRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 32,
    },
    stepDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepDotActive: {
      backgroundColor: colors.primary,
    },
    stepText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    stepTextActive: {
      color: '#FFFFFF',
    },
    stepTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 20,
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
    nextButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      flex: 1,
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      backgroundColor: colors.border,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      flex: 1,
      marginRight: 12,
    },
    backButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: 8,
    },
  })
}
