import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Briefcase, Building2, Calendar, Link, Upload, User, X } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { ProfileService, type Profile, type ProfileInput } from '@/services/ProfileService'
import { AvatarStore } from '@/services/AvatarStore'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

export const DEFAULT_AVATARS = [
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=13',
  'https://i.pravatar.cc/150?img=14',
  'https://i.pravatar.cc/150?img=15',
]

interface EditProfileModalProps {
  visible: boolean
  onClose: () => void
  onSaved?: () => void
  initialProfile?: Profile | null
  initialAvatarUrl?: string | null
}

export default function EditProfileModal({
  visible,
  onClose,
  onSaved,
  initialProfile,
  initialAvatarUrl,
}: EditProfileModalProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { user, getToken } = useAuthContext()
  const styles = makeStyles(colors)

  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [occupation, setOccupation] = useState('')
  const [selectedDefault, setSelectedDefault] = useState<string>(DEFAULT_AVATARS[0])
  const [customUrl, setCustomUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const toFullUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url
    }
    const base = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api').replace('/api', '')
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const avatarUrl = customUrl.trim() || selectedDefault || DEFAULT_AVATARS[0]
  const displayAvatarUrl = toFullUrl(avatarUrl)

  useEffect(() => {
    if (!visible) return
    setFullName(initialProfile?.fullName ?? '')
    setAge(initialProfile?.age != null ? String(initialProfile.age) : '')
    setCity(initialProfile?.city ?? '')
    setOccupation(initialProfile?.occupation ?? '')

    const initialAvatar = initialAvatarUrl ?? DEFAULT_AVATARS[0]
    if (DEFAULT_AVATARS.includes(initialAvatar)) {
      setSelectedDefault(initialAvatar)
      setCustomUrl('')
    } else {
      setSelectedDefault('')
      setCustomUrl(initialAvatar)
    }
    setSaving(false)
  }, [visible, initialProfile, initialAvatarUrl])

  const handleSelectDefault = (url: string) => {
    setSelectedDefault(url)
    setCustomUrl('')
  }

  const handleCustomUrlChange = (text: string) => {
    setCustomUrl(text)
    if (text.trim()) {
      setSelectedDefault('')
    }
  }

  const handleUploadFromDevice = async () => {
    setUploadError(null)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (result.canceled || !result.assets?.[0]) {
        return
      }

      const asset = result.assets[0]
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setUploadError('Image must be smaller than 5MB')
        return
      }

      setUploading(true)
      const token = await getToken()
      if (!token || !user?.id) {
        setUploading(false)
        return
      }

      const { avatarUrl: uploadedUrl } = await ProfileService.uploadAvatar(asset.uri, token)
      setCustomUrl(uploadedUrl)
      setSelectedDefault('')
      setUploadError(null)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      setUploadError('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getToken()
      if (!token || !user?.id) return

      const parsedAge = age.trim() ? Number(age.trim()) : undefined
      const ageNum = parsedAge !== undefined && !Number.isNaN(parsedAge) ? parsedAge : undefined

      const payload: ProfileInput = {
        fullName: fullName.trim() || undefined,
        age: ageNum,
        city: city.trim() || undefined,
        occupation: occupation.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      }

      await ProfileService.updateProfile(payload, token)
      await AvatarStore.saveAvatarUrl(user.id, avatarUrl)
      onSaved?.()
      onClose()
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={24} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.selectedAvatarRing}>
              <Image source={{ uri: displayAvatarUrl }} style={styles.selectedAvatar} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarRow}
            >
              {DEFAULT_AVATARS.map((url) => (
                <Pressable
                  key={url}
                  onPress={() => handleSelectDefault(url)}
                  style={[
                    styles.avatarOption,
                    selectedDefault === url && styles.avatarOptionSelected,
                  ]}
                >
                  <Image source={{ uri: url }} style={styles.avatarOptionImage} />
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleUploadFromDevice}
              disabled={uploading}
              style={styles.uploadButton}
              accessibilityRole="button"
              accessibilityLabel="Upload from device"
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Upload size={18} color={colors.primary} style={styles.uploadIcon} />
                  <Text style={styles.uploadButtonText}>Upload from device</Text>
                </>
              )}
            </Pressable>

            {uploadError ? (
              <Text style={styles.uploadError}>{uploadError}</Text>
            ) : null}

            <View style={styles.customUrlField}>
              <Text style={styles.customUrlLabel}>Or paste image URL</Text>
              <View style={styles.inputWrapper}>
                <Link size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/photo.jpg"
                  placeholderTextColor={colors.textSecondary}
                  value={customUrl}
                  onChangeText={handleCustomUrlChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Personal Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Age (Years)</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 28"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>City / Region</Text>
              <View style={styles.inputWrapper}>
                <Building2 size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bengaluru"
                  placeholderTextColor={colors.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Occupation</Text>
              <View style={styles.inputWrapper}>
                <Briefcase size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Senior Software Engineer"
                  placeholderTextColor={colors.textSecondary}
                  value={occupation}
                  onChangeText={setOccupation}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    saveButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 20,
    },
    selectedAvatarRing: {
      width: 132,
      height: 132,
      borderRadius: 66,
      borderWidth: 4,
      borderColor: colors.primary,
      padding: 4,
      marginBottom: 20,
      backgroundColor: colors.surface,
    },
    selectedAvatar: {
      width: 116,
      height: 116,
      borderRadius: 58,
      backgroundColor: colors.primarySoft,
    },
    avatarRow: {
      paddingHorizontal: 4,
      gap: 12,
    },
    avatarOption: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: colors.border,
      padding: 3,
      marginRight: 12,
      backgroundColor: colors.surface,
    },
    avatarOptionSelected: {
      borderColor: colors.primary,
    },
    avatarOptionImage: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.primarySoft,
    },
    uploadButton: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 14,
      height: 48,
      marginTop: 8,
    },
    uploadIcon: {
      marginRight: 8,
    },
    uploadButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.medium,
      color: colors.primary,
    },
    uploadError: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.medium,
      color: colors.danger,
      marginTop: 8,
      textAlign: 'center',
    },
    customUrlField: {
      width: '100%',
      marginTop: 16,
    },
    customUrlLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 6,
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
  })
}
