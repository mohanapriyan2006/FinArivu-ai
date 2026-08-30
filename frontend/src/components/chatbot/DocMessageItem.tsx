import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Bot, Sparkles, Volume2 } from 'lucide-react-native'

let Speech: any = { stop: () => {}, speak: () => {} }
let isTtsAvailable = false

try {
  Speech = require('expo-speech')
  isTtsAvailable = true
} catch (e) {
  console.warn('expo-speech is not available in this runtime:', e)
}

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'
import {
  BudgetArtifactCard,
  GoalArtifactCard,
  HealthArtifactCard,
  RetirementArtifactCard,
  TaxArtifactCard,
} from './ArtifactCards'
import { FollowUpChips } from './FollowUpChips'
import { MarkdownMessage } from './MarkdownMessage'

export interface ChatArtifact {
  type: string
  title: string
  content: Record<string, any>
}

export interface ChatFollowUp {
  label: string
  type?: string
  payload?: Record<string, any>
}

export interface SuggestedAction {
  id: string
  label: string
  type: 'CHAT_FOLLOWUP' | 'NAVIGATE' | 'API_ACTION' | 'CREATE' | 'VIEW' | 'SIMULATE'
  payload?: Record<string, any>
  enabled?: boolean
  route?: string
}

export interface ChatMessageItemData {
  id: string
  role: 'user' | 'assistant'
  content: string
  summary?: string
  responseType?: string
  intent?: string
  agentsUsed?: string[]
  data?: Record<string, any>
  artifacts?: ChatArtifact[]
  recommendations?: { title: string; description: string; category: string }[]
  followUpQuestions?: ChatFollowUp[] | string[]
  suggestedActions?: SuggestedAction[]
  disclaimer?: string
  guardrailTriggered?: boolean
  createdAt?: string
}

interface DocMessageItemProps {
  item: ChatMessageItemData
  onSelectFollowUp: (chipText: string) => void
  onSelectAction?: (action: SuggestedAction) => void
}

export function DocMessageItem({ item, onSelectFollowUp, onSelectAction }: DocMessageItemProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [isSpeaking, setIsSpeaking] = useState(false)

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
  const responseType = item.responseType || ''

  const handleActionPress = (action: SuggestedAction) => {
    if (onSelectAction) {
      onSelectAction(action)
    } else if (onSelectFollowUp) {
      onSelectFollowUp((action.payload?.question as string) || action.label)
    }
  }

  const handleSpeak = () => {
    if (!isTtsAvailable) return
    if (isSpeaking) {
      Speech.stop()
      setIsSpeaking(false)
      return
    }

    Speech.stop()
    setIsSpeaking(true)
    Speech.speak(item.content, {
      language: 'en',
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
  }

  const renderArtifact = (artifact: ChatArtifact, index: number) => {
    const content = artifact.content || {}
    switch (artifact.type) {
      case 'health_card':
        return <HealthArtifactCard key={`art-${index}`} data={content as any} />
      case 'budget_card':
      case 'expense_card':
        return <BudgetArtifactCard key={`art-${index}`} data={content as any} />
      case 'goal_card':
        return <GoalArtifactCard key={`art-${index}`} data={content as any} />
      case 'tax_card':
        return <TaxArtifactCard key={`art-${index}`} data={content as any} />
      case 'retirement_card':
        return <RetirementArtifactCard key={`art-${index}`} data={content as any} />
      default:
        return (
          <View key={`art-${index}`} style={styles.artifactCard}>
            <Text style={styles.artifactTitle}>{artifact.title}</Text>
            <Text style={styles.artifactType}>{artifact.type.replace(/_/g, ' ')}</Text>
          </View>
        )
    }
  }

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
        <MarkdownMessage content={item.content} />

        {/* Render artifacts from backend only */}
        {item.artifacts && item.artifacts.length > 0 && (
          <View style={styles.artifactsList}>{item.artifacts.map(renderArtifact)}</View>
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
                  key={`action-${action.id || index}`}
                  style={({ pressed }) => [
                    styles.actionChip,
                    pressed && styles.actionChipPressed,
                  ]}
                  onPress={() => handleActionPress(action)}
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

        {/* Text-to-speech control */}
        <View style={styles.speakerRow}>
          <Pressable
            onPress={handleSpeak}
            style={[
              styles.speakerButton,
              isSpeaking && styles.speakerButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isSpeaking ? 'Stop reading' : 'Read aloud'}
          >
            <Volume2
              size={16}
              color={isSpeaking ? colors.primary : colors.textSecondary}
              strokeWidth={2.2}
            />
          </Pressable>
        </View>
      </View>

      {/* Follow-up Chips at bottom */}
      <FollowUpChips onSelect={onSelectFollowUp} suggestions={item.followUpQuestions} />
    </Animated.View>
  )
}

const makeStyles = (colors: ThemeColors) =>
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
    speakerRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    speakerButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    speakerButtonActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
  })
