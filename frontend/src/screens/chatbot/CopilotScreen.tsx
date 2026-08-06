import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  FadeIn,
  FadeInDown,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {
  ArrowUp,
  Bot,
  Landmark,
  Plus,
  Settings,
  Wallet,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import { CARD_SHADOW } from '@/components/insights/Common'

// ==========================================
// CONSTANTS
// ==========================================
const BOTTOM_TAB_HEIGHT = 60

// ==========================================
// TYPES & MOCK DATA
// ==========================================
type MessageType = 'user' | 'thinking' | 'artifact' | 'text'

interface ChatMessage {
  id: string
  type: MessageType
  text?: string
  artifactData?: {
    title: string
    liability: string
    gains: string
    deductions: string
    buttonText: string
  }
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'user-1',
    type: 'user',
    text: 'Calculate my Q3 estimated tax liability based on recent high-growth crypto activity.',
  },
]

// ==========================================
// SUBCOMPONENTS
// ==========================================

// 1. User Message (Italic Quote Layout)
function UserMessage({ text }: { text: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.userMsgContainer}>
      <Text style={styles.userMsgQuote}>
        "{text}"
      </Text>
    </Animated.View>
  )
}

// 2. Thinking Indicator (Pulsing Geometric Loader)
function ThinkingIndicator({ text = 'Calculating potential tax liabilities...' }: { text?: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)

  useEffect(() => {
    // Breathing scale animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1200 }),
        withTiming(0.8, { duration: 1200 })
      ),
      -1,
      true
    )

    // Slow infinite rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 6000 }),
      -1,
      false
    )
  }, [scale, rotation])

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
  }))

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.thinkingContainer}>
      <View style={styles.loaderWrapper}>
        <Animated.View style={[styles.loaderOuterRing, loaderStyle]}>
          {/* Overlapping colorful AI petals */}
          <View style={[styles.petal, styles.petal0, { backgroundColor: colors.primary }]} />
          <View style={[styles.petal, styles.petal120, { backgroundColor: colors.accent }]} />
          <View style={[styles.petal, styles.petal240, { backgroundColor: '#A78BFA' }]} />
        </Animated.View>
      </View>
      <Text style={styles.thinkingText}>{text}</Text>
    </Animated.View>
  )
}

// 3. Tax Artifact Card (Interactive UI Card)
interface ArtifactData {
  title: string
  liability: string
  gains: string
  deductions: string
  buttonText: string
}

function TaxArtifactCard({ data }: { data: ArtifactData }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const btnScale = useSharedValue(1)

  const btnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }))

  const handlePressIn = () => {
    btnScale.value = withTiming(0.96, { duration: 80 })
  }

  const handlePressOut = () => {
    btnScale.value = withTiming(1, { duration: 80 })
  }

  return (
    <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.artifactCard}>
      {/* Header */}
      <View style={styles.artifactHeader}>
        <View style={styles.artifactHeaderIcon}>
          <Landmark size={15} color={colors.primary} strokeWidth={2.5} />
        </View>
        <Text style={styles.artifactHeaderTitle}>{data.title}</Text>
      </View>

      {/* Hero Liability */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>ESTIMATED LIABILITY</Text>
        <Text style={styles.heroValue}>{data.liability}</Text>
        <Text style={styles.heroSubtext}>Based on recent capital gains and Q3 distributions.</Text>
      </View>

      {/* Breakdown Row */}
      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Short-term Gains</Text>
          <Text style={[styles.breakdownValue, { color: colors.success }]}>
            {data.gains}
          </Text>
        </View>
        <View style={[styles.breakdownRow, { marginTop: 8 }]}>
          <Text style={styles.breakdownLabel}>Deductions</Text>
          <Text style={[styles.breakdownValue, { color: colors.danger }]}>
            {data.deductions}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <Animated.View style={[styles.actionBtnContainer, btnAnimatedStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.actionBtn}
          accessibilityRole="button"
        >
          <Wallet size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>{data.buttonText}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

// 4. Floating Input Area (suspendable bottom pill)
interface FloatingInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  placeholder?: string
}

function FloatingInput({ value, onChangeText, onSend, placeholder }: FloatingInputProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const sendScale = useSharedValue(value.trim() ? 1 : 0.8)

  useEffect(() => {
    sendScale.value = withSpring(value.trim() ? 1.0 : 0.8, { damping: 15 })
  }, [value, sendScale])

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }))

  return (
    <View style={styles.inputFloatingContainer}>
      <Pressable style={styles.inputPlusBtn} accessibilityRole="button" accessibilityLabel="Add attachments">
        <Plus size={20} color={colors.textSecondary} strokeWidth={2.5} />
      </Pressable>
      <TextInput
        style={styles.inputField}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Ask a question or type command...'}
        placeholderTextColor={colors.textTertiary}
        onSubmitEditing={onSend}
        returnKeyType="send"
        blurOnSubmit={false}
      />
      <Animated.View style={sendStyle}>
        <Pressable
          style={[styles.inputSendBtn, !value.trim() && { opacity: 0.6 }]}
          onPress={onSend}
          disabled={!value.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <ArrowUp size={18} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
      </Animated.View>
    </View>
  )
}

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
export default function CopilotScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState('')
  const [thinkingText, setThinkingText] = useState('Calculating potential tax liabilities...')

  const listRef = useRef<FlatList<ChatMessage>>(null)

  // Calculate dynamic heights for safe positioning
  const tabBarHeight = Math.max(insets.bottom, 8) + BOTTOM_TAB_HEIGHT
  const inputBottomPosition = tabBarHeight + 12

  // Simulation on mount:
  // 1. Show user message.
  // 2. Delay 800ms -> add thinking indicator.
  // 3. Delay 3000ms -> replace thinking with estimate card.
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: 'thinking-1', type: 'thinking' },
      ])
    }, 800)

    const timer2 = setTimeout(() => {
      setMessages((prev) => {
        const cleaned = prev.filter((m) => m.id !== 'thinking-1')
        return [
          ...cleaned,
          {
            id: 'artifact-1',
            type: 'artifact',
            artifactData: {
              title: 'Q3 Tax Estimate (Calculated)',
              liability: '$8,420.00',
              gains: '+$24.5k',
              deductions: '-$1.2k',
              buttonText: 'Prepare Payment',
            },
          },
        ]
      })
    }, 3000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const scrollToEnd = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return

    setInputText('')
    Keyboard.dismiss()

    // Add user message
    const userMsgId = `user-${Date.now()}`
    const thinkingId = `thinking-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, type: 'user', text: trimmed },
    ])
    scrollToEnd()

    // Determine loading context
    const isTaxQuery = trimmed.toLowerCase().includes('tax') || trimmed.toLowerCase().includes('estimat')
    const customLoadingText = isTaxQuery
      ? 'Calculating potential tax liabilities...'
      : 'Synthesizing personal finance vectors...'

    // Wait and show loader
    setTimeout(() => {
      setThinkingText(customLoadingText)
      setMessages((prev) => [
        ...prev,
        { id: thinkingId, type: 'thinking' },
      ])
      scrollToEnd()
    }, 600)

    // Wait and show answer
    setTimeout(() => {
      setMessages((prev) => {
        const cleaned = prev.filter((m) => m.id !== thinkingId)

        if (isTaxQuery) {
          return [
            ...cleaned,
            {
              id: `artifact-${Date.now()}`,
              type: 'artifact',
              artifactData: {
                title: 'Q3 Tax Estimate (Calculated)',
                liability: '$8,420.00',
                gains: '+$24.5k',
                deductions: '-$1.2k',
                buttonText: 'Prepare Payment',
              },
            },
          ]
        } else {
          return [
            ...cleaned,
            {
              id: `text-${Date.now()}`,
              type: 'text',
              text: "I've reviewed your request. Based on your current income rate and goal sequences, you have a solid budget vector. If you adjust your dining expenses slightly, your Q3 tax cushion will remain fully optimized.",
            },
          ]
        }
      })
      scrollToEnd()
    }, 2800)
  }

  const renderItem = ({ item }: { item: ChatMessage }) => {
    switch (item.type) {
      case 'user':
        return <UserMessage text={item.text || ''} />
      case 'thinking':
        return <ThinkingIndicator text={thinkingText} />
      case 'artifact':
        if (item.artifactData) {
          return <TaxArtifactCard data={item.artifactData} />
        }
        return null
      case 'text':
        return (
          <Animated.View entering={FadeIn.duration(400)} style={styles.textMsgBubble}>
            <Text style={styles.textMsgContent}>{item.text}</Text>
          </Animated.View>
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Bot size={18} color={colors.primary} strokeWidth={2.5} />
        </View>
        <Text style={styles.headerTitle}>AI Copilot</Text>
        <Pressable style={styles.settingsButton} accessibilityRole="button">
          <Settings size={20} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Keyboard Avoiding Container */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Feed scroll area */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: tabBarHeight + 72 }, // Adequate space so last item floats above the pill bar
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
          />

          {/* Floating Pill Input Panel (Suspended above Bottom Tab Bar) */}
          <View style={[styles.bottomContainer, { bottom: inputBottomPosition }]}>
            <FloatingInput
              value={inputText}
              onChangeText={setInputText}
              onSend={handleSend}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ==========================================
// STYLES
// ==========================================
function makeStyles(colors: any) {
  const isDark = colors.background !== '#F8FAFC'

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
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    avatarContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    settingsButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 20,
      flexGrow: 1,
    },
    // User Message Styles
    userMsgContainer: {
      alignSelf: 'flex-end',
      maxWidth: '85%',
      marginVertical: 4,
      paddingLeft: 20,
    },
    userMsgQuote: {
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontStyle: 'italic',
      color: colors.textSecondary,
      textAlign: 'right',
      lineHeight: 22,
    },
    // Thinking Indicator Styles
    thinkingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
      alignSelf: 'flex-start',
    },
    loaderWrapper: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    loaderOuterRing: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    petal: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      opacity: 0.85,
    },
    petal0: {
      transform: [{ translateY: -7 }],
    },
    petal120: {
      transform: [{ rotate: '120deg' }, { translateY: -7 }],
    },
    petal240: {
      transform: [{ rotate: '240deg' }, { translateY: -7 }],
    },
    thinkingText: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    // Tax Artifact Card Styles
    artifactCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      width: '100%',
      ...CARD_SHADOW,
    },
    artifactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    artifactHeaderIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    artifactHeaderTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    heroSection: {
      marginBottom: 16,
    },
    heroLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 1.0,
      marginBottom: 4,
    },
    heroValue: {
      fontFamily: Typography.fontFamily,
      fontSize: 32,
      fontWeight: '800',
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    heroSubtext: {
      fontFamily: Typography.fontFamily,
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    breakdownContainer: {
      backgroundColor: isDark ? colors.background : colors.backgroundLight,
      borderRadius: 16,
      padding: 14,
      marginBottom: 18,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    breakdownLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    breakdownValue: {
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    actionBtnContainer: {
      width: '100%',
    },
    actionBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnText: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Plain text AI message response bubble
    textMsgBubble: {
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.chatBubbleBorder,
      borderRadius: 18,
      padding: 16,
      maxWidth: '85%',
      alignSelf: 'flex-start',
    },
    textMsgContent: {
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    // Floating Input Styles
    bottomContainer: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 200,
    },
    inputFloatingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 26,
      height: 52,
      paddingHorizontal: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    inputPlusBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputField: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      color: colors.textPrimary,
      paddingHorizontal: 8,
      height: '100%',
    },
    inputSendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
