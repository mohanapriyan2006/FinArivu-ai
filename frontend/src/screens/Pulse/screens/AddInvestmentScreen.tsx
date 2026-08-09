import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

import { PrimaryButton } from '@/components/forms/PrimaryButton'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { AssetService } from '@/services/AssetService'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

import { TrackerHeader } from '../components/TrackerHeader'

export default function AddInvestmentScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const navigation = useNavigation()
  const { getToken } = useAuthContext()

  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState('Mutual Fund')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    const amount = Number(value)
    if (!name.trim() || isNaN(amount) || amount <= 0) return

    setSaving(true)
    try {
      const token = await getToken()
      await AssetService.create(
        {
          name: name.trim(),
          assetType: assetType.trim() || 'Mutual Fund',
          value: amount,
          description: description.trim() || undefined,
        },
        token
      )
      navigation.goBack()
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TrackerHeader title="Add Investment" onAdd={undefined} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Record an existing investment. This is not a recommendation to buy or sell.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Investment name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="SBI Small Cap Fund"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            accessibilityLabel="Investment name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <TextInput
            style={styles.input}
            value={assetType}
            onChangeText={setAssetType}
            placeholder="Mutual Fund, Stock, PPF..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            accessibilityLabel="Investment type"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Current value</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder="100000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            accessibilityLabel="Current value"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notes]}
            value={description}
            onChangeText={setDescription}
            placeholder="Any notes about this investment"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            accessibilityLabel="Notes"
          />
        </View>

        <PrimaryButton
          title={saving ? 'Saving...' : 'Add Investment'}
          onPress={handleAdd}
          loading={saving}
          disabled={!name.trim() || !value.trim()}
          testID="add-investment-save"
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    subtitle: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: Typography.bodySmall.fontSize,
      lineHeight: Typography.bodySmall.lineHeight,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    notes: {
      height: 80,
      textAlignVertical: 'top',
    },
  })
