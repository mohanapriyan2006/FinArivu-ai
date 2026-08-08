import { useMemo, useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { OptionSelector } from '@/components/financialProfile/OptionSelector'
import type { EmploymentType } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self-employed', label: 'Self-Employed' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
]

export function AboutYouScreen({ onNext, onBack, onSkip, onExit }: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.aboutYou

  const [age, setAge] = useState<string>(existing?.age ? String(existing.age) : '')
  const [employmentType, setEmploymentType] = useState<EmploymentType | undefined>(
    existing?.employmentType
  )
  const [city, setCity] = useState<string>(existing?.city ?? '')
  const [dependents, setDependents] = useState<string>(
    existing?.dependents !== undefined ? String(existing.dependents) : ''
  )
  const [children, setChildren] = useState<string>(
    existing?.children !== undefined ? String(existing.children) : ''
  )

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 20,
        },
        flex: {
          flex: 1,
        },
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.sm,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
          marginBottom: 8,
          marginTop: 20,
        },
        input: {
          height: 56,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          color: colors.textPrimary,
        },
      }),
    [colors]
  )

  const ageValue = age === '' ? undefined : Number(age)
  const canContinue =
    ageValue !== undefined &&
    ageValue > 0 &&
    !!employmentType &&
    city.trim().length > 0

  const handleContinue = async () => {
    if (!canContinue) return
    await saveSection({
      section: 'aboutYou',
      data: {
        age: ageValue!,
        employmentType: employmentType!,
        city: city.trim(),
        dependents:
          dependents === '' ? undefined : Number(dependents),
        children: children === '' ? undefined : Number(children),
      },
    })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={0}
      totalSteps={13}
      stepTitle="About You"
      title="Let's get to know you"
      subtitle="A few basics help your Personal CFO understand your planning horizon."
      canContinue={!!canContinue}
      onBack={onExit}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      <Text style={styles.label}>How old are you?</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="e.g. 28"
        placeholderTextColor={colors.textTertiary}
        value={age}
        onChangeText={setAge}
        maxLength={3}
      />

      <Text style={styles.label}>Employment type</Text>
      <OptionSelector
        options={EMPLOYMENT_OPTIONS}
        selected={employmentType}
        onSelect={setEmploymentType}
        layout="wrap"
      />

      <Text style={styles.label}>Which city do you live in?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Bengaluru"
        placeholderTextColor={colors.textTertiary}
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.label}>Dependents (optional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={dependents}
            onChangeText={setDependents}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.label}>Children (optional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={children}
            onChangeText={setChildren}
          />
        </View>
      </View>
    </FinancialProfileStepper>
  )
}
