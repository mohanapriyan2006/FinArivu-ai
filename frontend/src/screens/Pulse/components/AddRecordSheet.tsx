import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

export interface FormField {
  key: string
  label: string
  placeholder?: string
  keyboard?: 'default' | 'numeric'
  secure?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

interface AddRecordSheetProps {
  visible: boolean
  title: string
  fields: FormField[]
  onClose: () => void
  onSubmit: (values: Record<string, string>) => void
  testID?: string
}

export function AddRecordSheet({ visible, title, fields, onClose, onSubmit, testID }: AddRecordSheetProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [values, setValues] = useState<Record<string, string>>({})

  const handleSave = () => {
    onSubmit(values)
    setValues({})
  }

  const handleChange = (key: string, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }))
  }

  return (
    <Modal
      testID={testID}
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={values[field.key] ?? ''}
                onChangeText={(text) => handleChange(field.key, text)}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textTertiary}
                keyboardType={field.keyboard ?? 'default'}
                secureTextEntry={field.secure ?? false}
                autoCapitalize={field.autoCapitalize ?? 'sentences'}
                accessibilityLabel={field.label}
              />
            </View>
          ))}
          <Pressable
            onPress={handleSave}
            style={[styles.save, { backgroundColor: colors.primary }]}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Save"
          >
            <Text style={[styles.saveText, { color: colors.surface }]}>Save</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={styles.cancel}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
    },
    sheetContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      paddingTop: 12,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: Typography.h3.fontSize,
      lineHeight: Typography.h3.lineHeight,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 20,
      textAlign: 'center',
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: Typography.bodySmall.fontSize,
      lineHeight: Typography.bodySmall.lineHeight,
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
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    save: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
      minHeight: 44,
    },
    saveText: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      fontWeight: '700',
    },
    cancel: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
      minHeight: 44,
    },
    cancelText: {
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      fontWeight: '700',
    },
  })
