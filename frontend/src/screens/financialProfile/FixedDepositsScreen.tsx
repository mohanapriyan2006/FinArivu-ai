import { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Plus, Trash2 } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { FinancialProfileStepper } from '@/components/financialProfile/FinancialProfileStepper'
import { MoneyInput } from '@/components/financialProfile/MoneyInput'
import type { FDProfile, FixedDeposit } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { StepScreenProps } from './FinancialProfileSetupScreen'

function createFD(): FixedDeposit {
  return {
    id: `fd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    value: 0,
  }
}

export function FixedDepositsScreen({
  onNext,
  onBack,
  onSkip,
  onExit,
}: StepScreenProps) {
  const { colors } = useTheme()
  const { profile, saveSection } = useFinancialProfile()
  const existing = profile.fixedDeposits

  const [fds, setFds] = useState<FixedDeposit[]>(existing?.fds ?? [createFD()])

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
        label: {
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.fontWeights.semibold,
          color: colors.textSecondary,
          marginTop: 12,
          marginBottom: 6,
        },
        input: {
          height: 48,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: 14,
          fontFamily: Typography.fontFamily,
          fontSize: Typography.sizes.base,
          color: colors.textPrimary,
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

  const totalValue = fds.reduce((sum, fd) => sum + (fd.value ?? 0), 0)

  const canContinue =
    totalValue >= 0 &&
    fds.every((fd) => typeof fd.value === 'number' && fd.value >= 0)

  const updateFd = (index: number, fd: FixedDeposit) => {
    setFds((prev) => {
      const next = [...prev]
      next[index] = fd
      return next
    })
  }

  const removeFd = (index: number) => {
    setFds((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = async () => {
    if (!canContinue) return
    const data: FDProfile = { totalValue, fds }
    await saveSection({ section: 'fixedDeposits', data })
    onNext()
  }

  return (
    <FinancialProfileStepper
      currentStepIndex={8}
      totalSteps={13}
      stepTitle="Fixed Deposits"
      title="Add your fixed deposit details"
      canContinue={!!canContinue}
      onBack={onBack}
      onContinue={handleContinue}
      onSkip={onSkip}
      onExit={onExit}
    >
      {fds.map((fd, index) => (
        <View key={fd.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>FD {index + 1}</Text>
            {fds.length > 1 ? (
              <Pressable
                onPress={() => removeFd(index)}
                style={styles.deleteButton}
                accessibilityRole="button"
                accessibilityLabel="Delete fixed deposit"
              >
                <Trash2 size={18} color={colors.danger} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>

          <MoneyInput
            value={fd.value}
            onChange={(value) => updateFd(index, { ...fd, value: value ?? 0 })}
            label="FD value"
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Interest rate (%)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Optional"
                placeholderTextColor={colors.textTertiary}
                value={fd.interestRate === undefined ? '' : String(fd.interestRate)}
                onChangeText={(text) =>
                  updateFd(index, {
                    ...fd,
                    interestRate: text === '' ? undefined : Number(text),
                  })
                }
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Maturity year</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Optional"
                placeholderTextColor={colors.textTertiary}
                value={fd.maturityYear === undefined ? '' : String(fd.maturityYear)}
                onChangeText={(text) =>
                  updateFd(index, {
                    ...fd,
                    maturityYear: text === '' ? undefined : Number(text),
                  })
                }
              />
            </View>
          </View>

          <Text style={styles.label}>Purpose</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={colors.textTertiary}
            value={fd.purpose ?? ''}
            onChangeText={(text) =>
              updateFd(index, { ...fd, purpose: text })
            }
          />
        </View>
      ))}

      <Pressable
        onPress={() => setFds((prev) => [...prev, createFD()])}
        style={styles.addButton}
        accessibilityRole="button"
        accessibilityLabel="Add another fixed deposit"
      >
        <Plus size={20} color={colors.primary} strokeWidth={2.5} />
        <Text style={styles.addText}>Add another FD</Text>
      </Pressable>
    </FinancialProfileStepper>
  )
}
