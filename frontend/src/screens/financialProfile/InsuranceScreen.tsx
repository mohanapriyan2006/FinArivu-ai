import { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Plus, Trash2 } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import { OptionSelector } from '@/components/financialProfile/OptionSelector'
import type { InsurancePolicy, InsuranceProfile, InsuranceType } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

const INSURANCE_TYPES: { value: InsuranceType; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'life', label: 'Life' },
]

function createPolicy(): InsurancePolicy {
  return {
    id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'health',
  }
}

export function InsuranceScreen({
  onNext,
  onBack,
  onSkip,
  onExit,
}: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.insurance

  const [policies, setPolicies] = useState<InsurancePolicy[]>(
    existing?.policies ?? [createPolicy()]
  )

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        title: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textPrimary,
        },
        deleteButton: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.dangerBackground,
          alignItems: 'center',
          justifyContent: 'center',
        },
        row: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 4,
        },
        flex: {
          flex: 1,
        },
        addButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.primary,
          borderStyle: 'dashed',
          marginTop: 8,
          minHeight: 52,
        },
        addText: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.primary,
          marginLeft: 8,
        },
      }),
    [colors]
  )

  const canContinue =
    policies.length > 0 &&
    policies.every((policy) => policy.type.length > 0)

  const updatePolicy = (index: number, policy: InsurancePolicy) => {
    setPolicies((prev) => {
      const next = [...prev]
      next[index] = policy
      return next
    })
  }

  const removePolicy = (index: number) => {
    setPolicies((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = async () => {
    if (!canContinue) return
    const data: InsuranceProfile = { policies }
    await saveSection({ section: 'insurance', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={10}
      totalSteps={13}
      stepTitle="Insurance"
      title="Add your insurance details"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      {policies.map((policy, index) => (
        <View key={policy.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Policy {index + 1}</Text>
            {policies.length > 1 ? (
              <Pressable
                onPress={() => removePolicy(index)}
                style={styles.deleteButton}
                accessibilityRole="button"
                accessibilityLabel="Delete insurance policy"
              >
                <Trash2 size={18} color={colors.danger} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>

          <OptionSelector
            options={INSURANCE_TYPES}
            selected={policy.type}
            onSelect={(value) =>
              updatePolicy(index, { ...policy, type: value })
            }
            label="Insurance type"
            layout="row"
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <MoneyInput
                value={policy.coverage}
                onChange={(value) =>
                  updatePolicy(index, { ...policy, coverage: value })
                }
                label="Coverage (optional)"
              />
            </View>
            <View style={styles.flex}>
              <MoneyInput
                value={policy.annualPremium}
                onChange={(value) =>
                  updatePolicy(index, { ...policy, annualPremium: value })
                }
                label="Annual premium (optional)"
              />
            </View>
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => setPolicies((prev) => [...prev, createPolicy()])}
        style={styles.addButton}
        accessibilityRole="button"
        accessibilityLabel="Add another insurance policy"
      >
        <Plus size={20} color={colors.primary} strokeWidth={2.5} />
        <Text style={styles.addText}>Add another policy</Text>
      </Pressable>
    </FinancialProfileStepper>
  )
}
