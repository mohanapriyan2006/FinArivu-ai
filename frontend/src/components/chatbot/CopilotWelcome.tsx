import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  Bot,
  Calculator,
  Calendar,
  Clock,
  Compass,
  EyeOff,
  PieChart,
  Target,
  TrendingUp,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'

interface CopilotWelcomeProps {
  onSelectSuggestion: (prompt: string) => void
}

const SUGGESTIONS1 = [
  {
    id: 'budget',
    label: 'Analyze my budget',
    prompt: 'Analyze my spending and budget utilization for this month.',
    icon: PieChart,
    color: '#5B4EFA',
  },
  {
    id: 'tax',
    label: 'Calculate my tax',
    prompt: 'Calculate my income tax under old vs new regime and show potential savings.',
    icon: Calculator,
    color: '#3B82F6',
  },
  {
    id: 'spending',
    label: 'Review spending',
    prompt: 'Where am I overspending this month compared to last month?',
    icon: TrendingUp,
    color: '#F59E0B',
  } 
]

const SUGGESTIONS2 = [
  {
    id: 'retirement',
    label: 'Plan retirement',
    prompt: 'Project my required retirement corpus based on my expenses and inflation.',
    icon: Compass,
    color: '#8B5CF6',
  },
  {
    id: 'goal',
    label: 'Create goal',
    prompt: 'Help me plan a monthly savings target to buy a house in 5 years.',
    icon: Target,
    color: '#10B981',
  },
  {
    id: 'report',
    label: 'Weekly report',
    prompt: 'Generate my latest weekly financial health summary report.',
    icon: Calendar,
    color: '#EC4899',
  },
]

const SUGGESTIONS3 = [
  {
    id: 'today',
    label: 'What next today',
    prompt: 'What is the single most important financial action I should take today?',
    icon: Clock,
    color: '#5B4EFA',
  },
  {
    id: 'week',
    label: 'What next this week',
    prompt: 'What are my top 3 financial priorities for this week?',
    icon: Calendar,
    color: '#3B82F6',
  },
  {
    id: 'month',
    label: 'What next this month',
    prompt: 'What should I focus on financially this month to stay on track?',
    icon: TrendingUp,
    color: '#F59E0B',
  },
  {
    id: 'ignore',
    label: 'What to ignore',
    prompt: 'What financial distractions, spending urges, or market noise should I ignore right now?',
    icon: EyeOff,
    color: '#F43F5E',
  },
]

export function CopilotWelcome({ onSelectSuggestion }: CopilotWelcomeProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Bot Avatar */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.heroAvatarContainer}>
        <View style={styles.outerGlowRing}>
          <View style={styles.innerAvatar}>
            <Bot size={38} color="#FFFFFF" strokeWidth={2} />
          </View>
        </View>
      </Animated.View>

      {/* Main Title */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.textContainer}>
        <Text style={styles.headlineText}>How can I help today?</Text>
        <Text style={styles.subtextText}>
          Your AI Personal CFO is ready to analyze budgets, compute tax regimes, project goals, and summarize financial health.
        </Text>
      </Animated.View>

      {/* Action Chips Horizontal Scroll */}
      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.chipsContainer}>
        <Text style={styles.chipsHeader}>SUGGESTED ACTIONS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {SUGGESTIONS1.map((item) => {
            const IconComponent = item.icon
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.chipButton,
                  pressed && styles.chipButtonPressed,
                ]}
                onPress={() => onSelectSuggestion(item.prompt)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${item.color}1F` }]}>
                  <IconComponent size={15} color={item.color} strokeWidth={2.2} />
                </View>
                <Text style={styles.chipText}>{item.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
        <View style={{height: 20}}/>
         <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {SUGGESTIONS2.map((item) => {
            const IconComponent = item.icon
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.chipButton,
                  pressed && styles.chipButtonPressed,
                ]}
                onPress={() => onSelectSuggestion(item.prompt)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${item.color}1F` }]}>
                  <IconComponent size={15} color={item.color} strokeWidth={2.2} />
                </View>
                <Text style={styles.chipText}>{item.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
        <View style={{height: 20}}/>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {SUGGESTIONS3.map((item) => {
            const IconComponent = item.icon
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.chipButton,
                  pressed && styles.chipButtonPressed,
                ]}
                onPress={() => onSelectSuggestion(item.prompt)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${item.color}1F` }]}>
                  <IconComponent size={15} color={item.color} strokeWidth={2.2} />
                </View>
                <Text style={styles.chipText}>{item.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </Animated.View>
    </ScrollView>
  )
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    scrollContainer: {
      flex: 1,
    },
    container: {
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 150,
      alignItems: 'center',
    },
    heroAvatarContainer: {
      marginBottom: 20,
    },
    outerGlowRing: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: 'rgba(91, 78, 250, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(91, 78, 250, 0.3)',
    },
    innerAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    textContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    headlineText: {
      ...Typography.displaySmall,
      color: colors.textHero,
      fontWeight: '800',
      fontSize: 24,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtextText: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 20,
    },
    chipsContainer: {
      width: '100%',
    },
    chipsHeader: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontWeight: '700',
      letterSpacing: 1,
      fontSize: 11,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    chipsScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingRight: 20,
    },
    chipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    chipButtonPressed: {
      opacity: 0.75,
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    iconWrapper: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      ...Typography.labelMedium,
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
    },
  })
}
