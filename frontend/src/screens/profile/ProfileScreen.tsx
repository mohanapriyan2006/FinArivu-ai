import React from 'react'
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
import { Svg, Circle, G } from 'react-native-svg'
import {
  Bell,
  Bot,
  CheckCircle2,
  ChevronLeft,
  Link,
  LogOut,
  Pencil,
  Settings,
  Shield,
  SlidersHorizontal,
  Target,
  User,
  Wallet,
} from 'lucide-react-native'

import { ProfileStatCard } from './ProfileStatCard'
import { SettingsListItem } from './SettingsListItem'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface CompletionRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  value: string
  label: string
}

function CompletionRing({
  progress,
  size = 140,
  strokeWidth = 12,
  value,
  label,
}: CompletionRingProps) {
  const { colors } = useTheme()
  const styles = makeCompletionStyles(colors, size)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primaryDark}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={styles.textOverlay}>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  )
}

function makeCompletionStyles(colors: ThemeColors, size: number) {
  return StyleSheet.create({
    container: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    svg: {
      position: 'absolute',
    },
    textOverlay: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    valueText: {
      fontFamily: Typography.fontFamily,
      fontSize: 32,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    labelText: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      marginTop: 2,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  })
}

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
}

const AVATAR_URI = 'https://i.pravatar.cc/150?img=11'

export default function ProfileScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { user, logout } = useAuthContext()
  const styles = makeStyles(colors)

  const displayName = user?.fullName ?? 'Mohanapriyan'

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.iconButton} accessibilityRole="button">
            <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.iconButton} accessibilityRole="button">
            <Settings size={24} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} />
            <View style={styles.editBadge}>
              <Pencil size={14} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.goldBadge}>
              <Text style={styles.goldBadgeText}>★ AI Personal CFO Member</Text>
            </View>
            <Text style={styles.memberSince}>Member Since: 2026</Text>
          </View>
        </View>

        <View style={styles.completionCard}>
          <CompletionRing progress={0.92} value="92%" label="COMPLETE" />
          <Text style={styles.completionSubtext}>
            Complete your profile to unlock personalized AI insights.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            accessibilityRole="button"
          >
            <Text style={styles.completeNow}>Complete Now</Text>
          </Pressable>
        </View>

        <View style={styles.statsStack}>
          <ProfileStatCard
            title="Health Score"
            value="812"
            status="Excellent"
            statusColor={colors.success}
            borderColor={colors.primary}
            icon={Shield}
            iconBackgroundColor={colors.primaryBackground}
            iconColor={colors.primary}
          />
          <ProfileStatCard
            title="Net Worth"
            value="₹14.2L"
            status="+14% YoY"
            statusColor={colors.success}
            borderColor={colors.success}
            icon={Wallet}
            iconBackgroundColor={colors.successBackground}
            iconColor={colors.success}
          />
          <ProfileStatCard
            title="Goals Active"
            value="3 of 5"
            status="60% Done"
            statusColor={colors.accent}
            borderColor={colors.accent}
            icon={Target}
            iconBackgroundColor={colors.accentBackground}
            iconColor={colors.accent}
          />
        </View>

        <View style={styles.aiCard}>
          <View style={styles.aiWatermark}>
            <Bot size={140} color={colors.primary} strokeWidth={1} />
          </View>
          <View style={styles.aiIconBox}>
            <Bot size={28} color={colors.primaryDark} strokeWidth={2} />
          </View>
          <Text style={styles.aiTitle}>Your Financial Journey</Text>
          <Text style={styles.aiBody}>
            You have improved by{' '}
            <Text style={{ color: colors.primary, fontWeight: Typography.fontWeights.bold }}>
              12 points
            </Text>{' '}
            and unlocked{' '}
            <Text style={{ color: colors.primary, fontWeight: Typography.fontWeights.bold }}>
              2 financial milestones
            </Text>{' '}
            this quarter.
          </Text>
          <Pressable style={styles.aiButton} accessibilityRole="button">
            <Text style={styles.aiButtonText}>View Milestones</Text>
          </Pressable>
        </View>

        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          <SettingsListItem
            icon={User}
            title="Personal Information"
            subtitle="Manage your name, age, city and occupation"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingsListItem
            icon={SlidersHorizontal}
            title="Financial Preferences"
            subtitle="Update income, budget & goal settings"
          />
          <SettingsListItem
            icon={Link}
            title="Connected Accounts"
            subtitle="Bank accounts, investments & liabilities"
          />
          <SettingsListItem
            icon={Bell}
            title="Notifications"
            subtitle="Push, email and reminder preferences"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View style={styles.securitySection}>
          <View style={styles.securityBadges}>
            <View style={styles.securityItem}>
              <CheckCircle2 size={14} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.securityText}>Verified Email</Text>
            </View>
            <View style={styles.securityItem}>
              <CheckCircle2 size={14} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.securityText}>Verified Mobile</Text>
            </View>
            <View style={styles.securityItem}>
              <CheckCircle2 size={14} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.securityText}>Profile Secured</Text>
            </View>
          </View>

          <Pressable
            onPress={() => logout()}
            style={styles.logoutButton}
            accessibilityRole="button"
          >
            <LogOut size={20} color={colors.danger} strokeWidth={2} />
            <Text style={styles.logoutText}>Logout Account</Text>
          </Pressable>
        </View>
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
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      marginBottom: 8,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 20,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },

    hero: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarWrapper: {
      width: 84,
      height: 84,
      marginBottom: 12,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.border,
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    name: {
      fontFamily: Typography.fontFamily,
      fontSize: 20,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 10,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    goldBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    goldBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: 11,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
    memberSince: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },

    completionCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      marginBottom: 24,
      ...CARD_SHADOW,
    },
    completionSubtext: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 14,
      marginBottom: 6,
      lineHeight: 20,
    },
    completeNow: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },

    statsStack: {
      marginBottom: 24,
    },

    aiCard: {
      backgroundColor: colors.primaryBackground,
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      overflow: 'hidden',
      position: 'relative',
    },
    aiWatermark: {
      position: 'absolute',
      top: 8,
      right: -8,
      opacity: 0.06,
    },
    aiIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    aiTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 18,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    aiBody: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
      paddingRight: 24,
    },
    aiButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    aiButtonText: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },

    accountSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      marginBottom: 12,
    },

    securitySection: {
      marginBottom: 24,
    },
    securityBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 20,
    },
    securityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    securityText: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: colors.dangerTint,
    },
    logoutText: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.danger,
    },
  })
}
