import React, { useEffect, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import type { LucideIcon } from 'lucide-react-native'
import {
  Banknote,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Landmark,
  Link,
  LogOut,
  Monitor,
  Moon,
  Pencil,
  PiggyBank,
  Receipt,
  Shield,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react-native'

import { ProfileStatCard } from './ProfileStatCard'
import { SettingsListItem } from './SettingsListItem'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext'
import { useFinancialProfile } from '@/contexts/FinancialProfileContext'
import { ProfileService, type Profile } from '@/services/ProfileService'
import { AvatarStore } from '@/services/AvatarStore'
import EditProfileModal from './EditProfileModal'
import { ProfileProgressBar } from '@/components/financialProfile/ProfileProgressBar'
import { ProfileSectionCard } from '@/components/financialProfile/ProfileSectionCard'
import { PROFILE_COMPLETION_THRESHOLD, PROFILE_SECTIONS } from '@/utils/profileCompletion'
import type { OnboardingStepId, ProfileSectionId } from '@/types/financialProfile'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

const SECTION_ICONS: Record<ProfileSectionId, LucideIcon> = {
  aboutYou: User,
  income: Banknote,
  expenses: Receipt,
  savings: PiggyBank,
  investments: TrendingUp,
  loans: Landmark,
  goals: Target,
  fixedDeposits: PiggyBank,
  creditCards: Wallet,
  insurance: Shield,
  taxDetails: Receipt,
}

const SECTION_TO_STEP: Record<ProfileSectionId, OnboardingStepId> = {
  aboutYou: 'aboutYou',
  income: 'income',
  expenses: 'expenses',
  savings: 'savings',
  investments: 'investments',
  loans: 'loans',
  goals: 'goals',
  fixedDeposits: 'fixedDeposits',
  creditCards: 'creditCards',
  insurance: 'insurance',
  taxDetails: 'taxDetails',
}

const AVATAR_URI = 'https://i.pravatar.cc/150?img=11'

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { user, logout, getToken } = useAuthContext()
  const { completion, resumeStep } = useFinancialProfile()
  const styles = makeStyles(colors)

  const [savedProfile, setSavedProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)

  const displayName = savedProfile?.fullName || user?.fullName || 'Mohanapriyan'
  const email = user?.email || 'mohan@finarivu.ai'

  const openEditModal = () => setIsEditModalVisible(true)
  const closeEditModal = () => setIsEditModalVisible(false)

  useEffect(() => {
    async function load() {
      if (!user?.id) return
      try {
        const token = await getToken()
        const [profileData, storedAvatar] = await Promise.all([
          ProfileService.getProfile(token),
          AvatarStore.getAvatarUrl(user.id),
        ])
        setSavedProfile(profileData)
        setAvatarUrl(storedAvatar ?? AVATAR_URI)
      } catch (err) {
        console.error('Failed to load profile/avatar:', err)
      }
    }
    load()
  }, [user])

  const handleSaved = async () => {
    if (!user?.id) return
    try {
      const token = await getToken()
      const [profileData, storedAvatar] = await Promise.all([
        ProfileService.getProfile(token),
        AvatarStore.getAvatarUrl(user.id),
      ])
      setSavedProfile(profileData)
      setAvatarUrl(storedAvatar ?? AVATAR_URI)
    } catch (err) {
      console.error('Failed to refresh profile:', err)
    }
    closeEditModal()
  }

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  const themeOptions: { label: string; value: ThemeMode; icon: typeof Sun }[] = [
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
    { label: 'System', value: 'system', icon: Monitor },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <Pressable
          onPress={openEditModal}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Edit Profile"
        >
          <Pencil size={20} color={colors.primary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUrl ?? AVATAR_URI }} style={styles.avatar} />
              <Pressable
                style={styles.avatarBadge}
                onPress={openEditModal}
              >
                <Pencil size={12} color={colors.surface} strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.heroTextGroup}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{displayName}</Text>
                <View style={styles.proTag}>
                  <Sparkles size={12} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.proTagText}>Pro CFO</Text>
                </View>
              </View>

              <Text style={styles.email}>{email}</Text>
              <Text style={styles.memberSince}>Salaried Professional · Member since 2026</Text>
            </View>
          </View>
        </View>

        {/* Financial Profile */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financial Profile</Text>
        </View>

        <View style={styles.settingsGroup}>
          <View style={styles.profileCard}>
            <View style={styles.profileCardHeader}>
              <View>
                <Text style={styles.profileCardPercent}>{completion.percentage}% Complete</Text>
                <Text style={styles.profileCardSub}>
                  {completion.percentage >= PROFILE_COMPLETION_THRESHOLD
                    ? 'Your Personal CFO has enough to work with'
                    : 'Add a few more details for better insights'}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  navigation.navigate('FinancialProfileSetup', {
                    startStep: completion.lastIncompleteSection ?? resumeStep,
                  })
                }
                style={styles.continueButton}
                accessibilityRole="button"
                accessibilityLabel="Continue setup"
              >
                <Text style={styles.continueText}>Continue Setup</Text>
              </Pressable>
            </View>
            <View style={styles.progressBarContainer}>
              <ProfileProgressBar percentage={completion.percentage} />
            </View>
          </View>

          {/* {PROFILE_SECTIONS.filter((s) => !s.isOptional).map((section) => {
            const status = completion.bySection[section.id]
            return (
              <ProfileSectionCard
                key={section.id}
                icon={SECTION_ICONS[section.id]}
                title={section.title}
                description={status.complete ? 'Completed' : 'Not added yet'}
                complete={status.complete}
                onPress={() =>
                  navigation.navigate('FinancialProfileSetup', {
                    startStep: SECTION_TO_STEP[section.id],
                  })
                }
              />
            )
          })} */}

        </View>

        {/* Appearance Mode Segmented Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appearance</Text>
        </View>

        <View style={styles.themeContainer}>
          {themeOptions.map((opt) => {
            const Icon = opt.icon
            const isSelected = mode === opt.value
            return (
              <Pressable
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={[
                  styles.themeTab,
                  isSelected && styles.themeTabActive,
                ]}
                accessibilityRole="button"
              >
                <Icon
                  size={18}
                  color={isSelected ? colors.primary : colors.textSecondary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.themeTabText,
                    isSelected && styles.themeTabTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Account Options */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account & Controls</Text>
        </View>

        <View style={styles.settingsGroup}>
          <SettingsListItem
            icon={User}
            title="Personal Details"
            subtitle="Name, age, city & occupation"
            onPress={openEditModal}
          />

          <SettingsListItem
            icon={Link}
            title="Connected Accounts"
            subtitle="Bank accounts, Demat & Liabilities"
            rightElement={
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={14} color={colors.success} strokeWidth={2.5} />
                <Text style={styles.verifiedBadgeText}>Soon</Text>
              </View>
            }
          />

          <SettingsListItem
            icon={Bell}
            title="Notifications & Alerts"
            subtitle="Budget thresholds, monthly reports & AI insights"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        {/* Security & Sign Out */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security & Session</Text>
        </View>

        <View style={styles.settingsGroup}>
          <SettingsListItem
            icon={Shield}
            title="Biometric & Security"
            subtitle="AES-256 encrypted local data"
            rightElement={
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={14} color={colors.success} strokeWidth={2.5} />
                <Text style={styles.verifiedBadgeText}>Soon</Text>
              </View>
            }
          />

          <SettingsListItem
            icon={LogOut}
            title="Sign Out"
            subtitle="Log out safely from this device"
            destructive
            showChevron={false}
            onPress={() => logout()}
          />
        </View>
      </ScrollView>

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={closeEditModal}
        onSaved={handleSaved}
        initialProfile={savedProfile}
        initialAvatarUrl={avatarUrl ?? undefined}
      />
    </SafeAreaView>
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
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },

    /* Hero Profile Card */
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    heroContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarWrapper: {
      position: 'relative',
      marginRight: 16,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primarySoft,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    heroTextGroup: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    name: {
      fontFamily: Typography.fontFamily,
      fontSize: 18,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    proTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    proTagText: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    email: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    memberSince: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },

    /* Section Headers */
    sectionHeader: {
      marginBottom: 10,
      marginTop: 4,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    /* Stats Grid */
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },

    /* Theme Segmented Switcher */
    themeContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 6,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    themeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 16,
    },
    themeTabActive: {
      backgroundColor: colors.primarySoft,
    },
    themeTabText: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    themeTabTextActive: {
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },

    /* Settings Group */
    settingsGroup: {
      marginBottom: 12,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.successBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    verifiedBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.success,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    profileCardPercent: {
      fontFamily: Typography.fontFamily,
      fontSize: 28,
      fontWeight: Typography.fontWeights.extraBold,
      color: colors.primary,
    },
    profileCardSub: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginTop: 4,
    },
    continueButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 14,
      marginLeft: -20,
      marginTop: -10,
    },
    continueText: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
    progressBarContainer: {
      width: '100%',
    },
  })
}
