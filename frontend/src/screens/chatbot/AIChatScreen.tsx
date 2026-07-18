import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { ArrowUp, Bot, Mic, Plus, Search } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { sendChatMessage } from '@/services/ChatService'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'

type MessageType = 'ai' | 'user'

interface Message {
  id: string
  type: MessageType
  text: string
  rich?: boolean
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'ai',
    text: "Good morning, Mohan. I've analyzed your recent activity. Your recurring subscriptions increased by 12% last month.",
    rich: true,
  },
  {
    id: '2',
    type: 'user',
    text: 'Can you suggest where I can cut back to reach my vacation goal faster?',
  },
]

const CHART_BARS = [
  { height: 48 },
  { height: 64 },
  { height: 56 },
  { height: 72 },
  { height: 96 },
]

const BOTTOM_TAB_CONTENT_HEIGHT = 60

function ChatHeader() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors, { bottom: 0, left: 0, right: 0, top: 0 }, 0), [colors])

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerIconBox}>
        <Bot size={20} color={colors.surface} strokeWidth={2} />
      </View>
      <View style={styles.headerTitleGroup}>
        <Text style={styles.headerTitle}>FinArivu AI</Text>
        <Text style={styles.headerSubtitle}>MOHAN'S PERSONAL CFO</Text>
      </View>
      <Pressable style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Search">
        <Search size={22} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

function MetricCards({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.metricCardsRow}>
      <View style={[styles.metricCard, styles.metricCardFirst]}>
        <Text style={styles.metricCardLabel}>Subscription Total</Text>
        <Text style={styles.metricCardValuePrimary}>$248.50</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricCardLabel}>Trend</Text>
        <Text style={styles.metricCardValueDanger}>+12.4%</Text>
      </View>
    </View>
  )
}

function BarChart({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.chartContainer}>
      {CHART_BARS.map((bar, index) => {
        const isCurrent = index === CHART_BARS.length - 1
        return (
          <View
            key={index}
            style={[
              styles.bar,
              isCurrent ? styles.barCurrent : styles.barMuted,
              { height: bar.height },
            ]}
          />
        )
      })}
    </View>
  )
}

function ActionChip({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <Pressable style={styles.actionChip} accessibilityRole="button">
      <Text style={styles.actionChipText}>View Subscriptions</Text>
    </Pressable>
  )
}

function AIRichMessage({ text, styles }: { text: string; styles: ReturnType<typeof makeStyles> }) {
  const cleanText = text.replace(/\*\*/g, '')
  return (
    <View style={styles.aiMessageWrapper}>
      <View style={styles.aiBubbleContainer}>
        <Text style={styles.aiBubbleText}>{cleanText}</Text>
        <MetricCards styles={styles} />
        <BarChart styles={styles} />
      </View>
      <ActionChip styles={styles} />
    </View>
  )
}

function AIPlainMessage({ text, styles }: { text: string; styles: ReturnType<typeof makeStyles> }) {
  // Avoid showing raw ** bold markers if the model emits markdown.
  const cleanText = text.replace(/\*\*/g, '')
  return (
    <View style={styles.aiMessageWrapper}>
      <View style={styles.aiBubbleContainer}>
        <Text style={styles.aiBubbleText}>{cleanText}</Text>
      </View>
    </View>
  )
}

function UserMessage({ text, styles }: { text: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.userBubbleContainer}>
      <Text style={styles.userBubbleText}>{text}</Text>
    </View>
  )
}

function ChatMessage({ message, styles }: { message: Message; styles: ReturnType<typeof makeStyles> }) {
  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.messageAnimatedWrapper}>
      {message.type === 'user' ? (
        <UserMessage text={message.text} styles={styles} />
      ) : message.rich ? (
        <AIRichMessage text={message.text} styles={styles} />
      ) : (
        <AIPlainMessage text={message.text} styles={styles} />
      )}
    </Animated.View>
  )
}

interface ChatInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void | Promise<void>
  isLoading: boolean
  colors: ThemeColors
  styles: ReturnType<typeof makeStyles>
}

function ChatInput({ value, onChangeText, onSend, isLoading, colors, styles }: ChatInputProps) {
  return (
    <View style={styles.inputOuterContainer}>
      <View style={styles.inputCapsule}>
        <Pressable style={styles.inputIconButton} accessibilityRole="button" accessibilityLabel="Add attachment">
          <Plus size={22} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        <TextInput
          style={styles.inputText}
          placeholder="Message your CFO..."
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          returnKeyType="send"
          multiline={false}
          blurOnSubmit={false}
        />
        <Pressable style={styles.inputIconButton} accessibilityRole="button" accessibilityLabel="Voice input">
          <Mic size={22} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={[styles.sendButton, isLoading && { opacity: 0.7 }]}
          onPress={onSend}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <ArrowUp size={20} color={colors.surface} strokeWidth={2.5} />
          )}
        </Pressable>
      </View>
    </View>
  )
}

export default function AIChatScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const tabBarHeight = Math.max(insets.bottom, 8) + BOTTOM_TAB_CONTENT_HEIGHT
  const styles = useMemo(() => makeStyles(colors, insets, tabBarHeight), [colors, insets, tabBarHeight])
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(
    () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  )
  const listRef = useRef<FlatList<Message>>(null)

  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true })
  }, [])

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { id: Date.now().toString(), type: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setError(null)

    try {
      const reply = await sendChatMessage(sessionId, trimmed)
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: reply.message,
      }
      setMessages((prev) => [...prev, aiReply])
    } catch (err) {
      setError('Unable to reach FinArivu AI. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading, sessionId])

  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item }) => <ChatMessage message={item} styles={styles} />,
    [styles]
  )

  const keyExtractor = useCallback((item: Message) => item.id, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={tabBarHeight}
      >
        <ChatHeader />
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.flatList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          inverted={false}
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
        />
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          isLoading={isLoading}
          colors={colors}
          styles={styles}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors, insets: EdgeInsets, tabBarHeight: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    flatList: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
    messageAnimatedWrapper: {
      marginBottom: 16,
    },

    // Header
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.heroCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleGroup: {
      flex: 1,
      justifyContent: 'center',
      marginHorizontal: 12,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xxs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 2,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // AI Message
    aiMessageWrapper: {
      alignSelf: 'flex-start',
      maxWidth: '85%',
    },
    aiBubbleContainer: {
      backgroundColor: colors.primaryBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.chatBubbleBorder,
      padding: 16,
    },
    aiBubbleText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: 16,
    },

    // Metric Cards
    metricCardsRow: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    metricCardFirst: {
      marginRight: 8,
    },
    metricCardLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xxs,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    metricCardValue: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.semibold,
    },
    metricCardValuePrimary: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },
    metricCardValueDanger: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.danger,
    },

    // Bar Chart
    chartContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 100,
      paddingHorizontal: 8,
    },
    bar: {
      width: 12,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    barMuted: {
      backgroundColor: colors.chartMuted,
    },
    barCurrent: {
      backgroundColor: colors.heroCard,
    },

    // Action Chip
    actionChip: {
      alignSelf: 'flex-start',
      marginTop: 10,
      backgroundColor: colors.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    actionChipText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.primary,
    },

    // User Message
    userBubbleContainer: {
      alignSelf: 'flex-end',
      maxWidth: '80%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
    },
    userBubbleText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textPrimary,
      lineHeight: 22,
    },

    errorContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    errorText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.medium,
      color: colors.danger,
      textAlign: 'center',
    },

    // Chat Input
    inputOuterContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: tabBarHeight + 8,
      backgroundColor: colors.background,
    },
    inputCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 52,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    },
    inputIconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputText: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textPrimary,
      marginHorizontal: 4,
      paddingVertical: 0,
      textAlignVertical: 'center',
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.heroCard,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
  })
}
