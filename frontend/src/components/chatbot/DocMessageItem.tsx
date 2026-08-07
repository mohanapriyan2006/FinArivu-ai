import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Bot, Sparkles } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import {
  BudgetArtifactCard,
  GoalArtifactCard,
  HealthArtifactCard,
  RetirementArtifactCard,
  TaxArtifactCard,
} from './ArtifactCards'
import { FollowUpChips } from './FollowUpChips'

export interface ChatMessageItemData {
  id: string
  role: 'user' | 'assistant'
  content: string
  summary?: string
  intent?: string
  agentsUsed?: string[]
  data?: Record<string, any>
  artifacts?: { type: string; title: string; content: Record<string, any> }[]
  followUpQuestions?: { text: string }[] | string[]
  suggestedActions?: { label: string; action: string; route?: string }[]
  disclaimer?: string
  guardrailTriggered?: boolean
  createdAt?: string
}

interface DocMessageItemProps {
  item: ChatMessageItemData
  onSelectFollowUp: (chipText: string) => void
}

export function DocMessageItem({ item, onSelectFollowUp }: DocMessageItemProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  // ── USER MESSAGE BUBBLE (Right-aligned, 16px radius, max 80%) ──────
  if (item.role === 'user') {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.userWrapper}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.content}</Text>
        </View>
      </Animated.View>
    )
  }

  // ── AI MESSAGE (Claude Document Style — Avatar → Text → Cards → Chips) ──
  const intent = item.intent || ''
  const agentData = item.data || {}

  // Detect which artifact cards to render
  const hasHealthData = intent === 'health_score' || agentData.HealthAgent
  const hasBudgetData = intent === 'budget_analysis' || agentData.BudgetAgent
  const hasGoalData = intent === 'goal_tracking' || agentData.GoalAgent
  const hasTaxData = intent === 'tax_planning' || agentData.TaxAgent
  const hasRetirementData = intent === 'retirement_planning' || agentData.RetirementAgent

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.aiDocContainer}>
      {/* AI Header Line */}
      <View style={styles.aiHeaderRow}>
        <View style={styles.aiAvatar}>
          <Bot size={16} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <Text style={styles.aiNameText}>FinArivu AI</Text>
        {intent && intent !== 'general' && (
          <View style={styles.intentBadge}>
            <Sparkles size={10} color={colors.primary} />
            <Text style={styles.intentBadgeText}>{intent.replace('_', ' ')}</Text>
          </View>
        )}
      </View>

      {/* Main Explanation Block */}
      <View style={styles.docBody}>
        <Text style={styles.explanationText}>{item.content}</Text>

        {item.summary ? (
          <Text style={styles.summaryText}>{item.summary}</Text>
        ) : null}

        {/* Render Artifact Cards */}
        {hasHealthData && (
          <HealthArtifactCard data={agentData.HealthAgent || agentData} />
        )}
        {hasBudgetData && (
          <BudgetArtifactCard data={agentData.BudgetAgent || agentData} />
        )}
        {hasGoalData && (
          <GoalArtifactCard data={agentData.GoalAgent || agentData} />
        )}
        {hasTaxData && (
          <TaxArtifactCard data={agentData.TaxAgent || agentData} />
        )}
        {hasRetirementData && (
          <RetirementArtifactCard data={agentData.RetirementAgent || agentData} />
        )}

        {/* Render structured artifacts from backend */}
        {item.artifacts && item.artifacts.length > 0 && (
          <View style={styles.artifactsList}>
            {item.artifacts.map((artifact, index) => (
              <View key={`artifact-${index}`} style={styles.artifactCard}>
                <Text style={styles.artifactTitle}>{artifact.title}</Text>
                <Text style={styles.artifactType}>{artifact.type.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggested Actions */}
        {item.suggestedActions && item.suggestedActions.length > 0 && (
          <View style={styles.actionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsScroll}
            >
              {item.suggestedActions.map((action, index) => (
                <Pressable
                  key={`action-${index}`}
                  style={({ pressed }) => [
                    styles.actionChip,
                    pressed && styles.actionChipPressed,
                  ]}
                  onPress={() => onSelectFollowUp(action.label)}
                >
                  <Text style={styles.actionChipText}>{action.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Disclaimer if present */}
        {item.disclaimer ? (
          <Text style={styles.disclaimerText}>{item.disclaimer}</Text>
        ) : null}
      </View>

      {/* Follow-up Chips at bottom */}
      <FollowUpChips onSelect={onSelectFollowUp} suggestions={item.followUpQuestions} />
    </Animated.View>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    userWrapper: {
      alignSelf: 'flex-end',
      maxWidth: '80%',
      marginVertical: 6,
      paddingHorizontal: 16,
    },
    userBubble: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      borderBottomRightRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    userText: {
      ...Typography.bodyMedium,
      color: colors.textHero,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    },
    aiDocContainer: {
      alignSelf: 'stretch',
      marginVertical: 10,
      paddingHorizontal: 16,
    },
    aiHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    aiAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiNameText: {
      ...Typography.titleSmall,
      color: colors.textHero,
      fontWeight: '700',
      fontSize: 14,
    },
    intentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      gap: 4,
      marginLeft: 'auto',
    },
    intentBadgeText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontWeight: '600',
      fontSize: 10,
      textTransform: 'capitalize',
    },
    docBody: {
      backgroundColor: 'transparent',
      paddingLeft: 36, // indent under avatar for clean doc look
    },
    explanationText: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 4,
    },
    summaryText: {
      ...Typography.bodySmall,
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    actionsContainer: {
      marginTop: 8,
    },
    artifactsList: {
      marginTop: 8,
      gap: 8,
    },
    artifactCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    artifactTitle: {
      ...Typography.titleSmall,
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
    },
    artifactType: {
      ...Typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 11,
      textTransform: 'capitalize',
      marginTop: 2,
    },
    actionsScroll: {
      paddingHorizontal: 4,
      gap: 8,
    },
    actionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: 'rgba(91, 78, 250, 0.25)',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    actionChipPressed: {
      opacity: 0.75,
      backgroundColor: colors.primary,
    },
    actionChipText: {
      ...Typography.labelSmall,
      color: colors.primary,
      fontWeight: '600',
      fontSize: 12,
    },
    disclaimerText: {
      ...Typography.bodySmall,
      color: colors.textTertiary,
      fontSize: 11,
      marginTop: 8,
      fontStyle: 'italic',
    },
  })
