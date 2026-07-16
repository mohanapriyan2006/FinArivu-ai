import React, { useMemo } from 'react'
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import {
  AlertTriangle,
  ChevronLeft,
  FileText,
  MoreVertical,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'

import { NotificationItem, type NotificationItemProps } from './NotificationItem'
import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

interface NotificationSection {
  title: string
  data: NotificationData[]
}

interface NotificationData extends Omit<NotificationItemProps, 'children'> {
  id: string
  body: React.ReactNode
}

const NOTIFICATIONS: NotificationSection[] = [
  {
    title: 'TODAY',
    data: [
      {
        id: '1',
        icon: TrendingUp,
        iconBackgroundColor: '#DBEAFE',
        iconColor: '#0A4CC5',
        title: 'Health Score Updated',
        body: (
          <>
            Your Financial Health Score went up by{' '}
            <Text style={{ color: '#16A34A' }}>+2 points</Text>. You are now in
            the top <Text style={{ color: '#0A4CC5' }}>85%</Text> of users.
          </>
        ),
        timestamp: '2h ago',
        unread: true,
        actionText: 'VIEW SCORE',
      },
      {
        id: '2',
        icon: AlertTriangle,
        iconBackgroundColor: '#FEF3C7',
        iconColor: '#F59E0B',
        title: 'Budget Alert: Dining Out',
        body: (
          <>
            You have used <Text style={{ color: '#F59E0B' }}>92%</Text> of your
            dining budget. Consider reducing spend this weekend.
          </>
        ),
        timestamp: '5h ago',
        unread: true,
        variant: 'progress',
        progress: 0.92,
        progressColor: '#F59E0B',
      },
    ],
  },
  {
    title: 'YESTERDAY',
    data: [
      {
        id: '3',
        variant: 'ai',
        icon: Sparkles,
        iconBackgroundColor: '#FEF3C7',
        iconColor: '#F4B400',
        title: 'AI Insight: Spending Pattern',
        body: (
          <>
            We noticed a 14% increase in impulse purchases. Optimizing your
            subscriptions could save you{' '}
            <Text style={{ color: '#16A34A' }}>₹3,200</Text> this month.
          </>
        ),
        timestamp: '1d ago',
        unread: false,
        aiButtonText: 'Optimize Spending',
      },
      {
        id: '4',
        icon: FileText,
        iconBackgroundColor: '#E2E8F0',
        iconColor: '#64748B',
        title: 'Tax Filing Reminder',
        body: (
          <>
            Your ITR deadline is in <Text style={{ color: '#F59E0B' }}>12 days</Text>.
            Upload Form 16 and review deductions now.
          </>
        ),
        timestamp: '1d ago',
        unread: false,
        actionText: 'UPLOAD NOW',
      },
    ],
  },
  {
    title: 'THIS WEEK',
    data: [
      {
        id: '5',
        icon: Wallet,
        iconBackgroundColor: '#DCFCE7',
        iconColor: '#16A34A',
        title: 'Net Worth Milestone',
        body: (
          <>
            Your net worth crossed <Text style={{ color: '#16A34A' }}>₹10 Lakhs</Text>.
            Great progress toward your retirement goal.
          </>
        ),
        timestamp: '3d ago',
        unread: false,
        actionText: 'VIEW DETAILS',
      },
      {
        id: '6',
        icon: TrendingUp,
        iconBackgroundColor: '#DBEAFE',
        iconColor: '#0A4CC5',
        title: 'Income Credited',
        body: (
          <>
            Salary of <Text style={{ color: '#0A4CC5' }}>₹85,000</Text> credited.
            Your savings rate this month is{' '}
            <Text style={{ color: '#16A34A' }}>24%</Text>.
          </>
        ),
        timestamp: '4d ago',
        unread: false,
      },
    ],
  },
]

export default function NotificationsScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Notifications'>>()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const sections = useMemo(() => NOTIFICATIONS, [])

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  const renderSectionHeader = (info: { section: NotificationSection }) => (
    <Text style={styles.sectionHeader}>{info.section.title}</Text>
  )

  const renderItem = (info: { item: NotificationData }) => {
    const { body, ...itemProps } = info.item
    return (
      <NotificationItem {...itemProps}>{body}</NotificationItem>
    )
  }

  const ListHeader = (
    <View style={styles.header}>
      <Pressable onPress={handleBack} style={styles.iconButton} accessibilityRole="button">
        <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
      <Text style={styles.headerTitle}>Notifications</Text>
      <Pressable style={styles.iconButton} accessibilityRole="button">
        <MoreVertical size={24} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  )

  const ListFooter = (
    <View style={styles.footer}>
      <Text style={styles.footerText}>TOGGLE VIEW</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {ListHeader}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        ListFooterComponent={ListFooter}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
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
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    sectionHeader: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 24,
      marginBottom: 12,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    footerText: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textTertiary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  })
}
