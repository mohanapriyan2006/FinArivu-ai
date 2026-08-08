import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Clock, History, MoreVertical, Plus, Trash2, X } from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { Typography } from '@/theme'
import { useCopilot } from '@/hooks/useCopilot'
import { CopilotHeader } from '@/components/chatbot/CopilotHeader'
import { CopilotWelcome } from '@/components/chatbot/CopilotWelcome'
import {
  DocMessageItem,
  type ChatMessageItemData,
  type SuggestedAction,
} from '@/components/chatbot/DocMessageItem'
import { CopilotInput } from '@/components/chatbot/CopilotInput'
import { ThinkingAnimation } from '@/components/chatbot/ThinkingAnimation'

export default function CopilotScreen({ navigation }: any) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { getToken } = useAuthContext()

  const {
    messages,
    isLoading,
    isStreaming,
    thinkingStep,
    isOnline,
    sendMessage,
    loadHistory,
    clearMessages,
    newChat,
    sessionId,
    sessions,
    loadSessions,
    loadSession,
  } = useCopilot()

  const [inputText, setInputText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(false)

  const flatListRef = useRef<FlatList>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [])

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputText).trim()
      if (!text) return

      setInputText('')
      Keyboard.dismiss()
      await sendMessage(text)
      scrollToBottom()
    },
    [inputText, sendMessage, scrollToBottom]
  )

  useEffect(() => {
    getToken().then((token) => {
      if (token) loadSessions()
    })
  }, [getToken, loadSessions])

  useEffect(() => {
    if (historyVisible) {
      getToken().then((token) => {
        if (token) loadSessions()
      })
    }
  }, [historyVisible, getToken, loadSessions])

  const closeMenu = useCallback(() => setMenuVisible(false), [])

  const handleClearChat = useCallback(() => {
    setMenuVisible(false)
    Alert.alert(
      'Clear chat',
      'This will remove the current conversation from the screen. It will still be saved on the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearMessages()
          },
        },
      ]
    )
  }, [clearMessages])

  const handleNewChat = useCallback(() => {
    setMenuVisible(false)
    newChat()
  }, [newChat])

  const handleOpenHistory = useCallback(() => {
    setMenuVisible(false)
    setHistoryVisible(true)
  }, [])

  const handleOpenSession = useCallback(
    async (targetSessionId: string) => {
      setHistoryVisible(false)
      await loadSession(targetSessionId)
      scrollToBottom()
    },
    [loadSession, scrollToBottom]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadHistory()
    setRefreshing(false)
  }, [loadHistory])

  const handleAction = useCallback(
    (action: SuggestedAction) => {
      if (action.type === 'CHAT_FOLLOWUP') {
        handleSendMessage((action.payload?.question as string) || action.label)
      } else if (action.type === 'NAVIGATE') {
        const screen = action.payload?.screen as string | undefined
        const params = (action.payload?.params as Record<string, any>) || undefined
        if (screen) {
          navigation.navigate(screen as never, params as never)
        }
      }
      // API_ACTION not yet implemented
    },
    [handleSendMessage, navigation]
  )

  const renderItem = useCallback(
    ({ item }: { item: ChatMessageItemData }) => (
      <DocMessageItem
        item={item}
        onSelectFollowUp={(chipText) => handleSendMessage(chipText)}
        onSelectAction={handleAction}
      />
    ),
    [handleAction, handleSendMessage]
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <CopilotHeader
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
          onMenu={() => setMenuVisible(true)}
          isOnline={isOnline}
        />

        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={closeMenu}
        >
          <Pressable style={styles.menuOverlay} onPress={closeMenu}>
            <View style={styles.menuCard}>
              <Pressable style={styles.menuItem} onPress={handleNewChat}>
                <Plus size={18} color={colors.textPrimary} strokeWidth={2} />
                <Text style={styles.menuItemText}>New chat</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={handleClearChat}>
                <Trash2 size={18} color={colors.danger} strokeWidth={2} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>Clear chat</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={handleOpenHistory}>
                <History size={18} color={colors.textPrimary} strokeWidth={2} />
                <Text style={styles.menuItemText}>History</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={historyVisible}
          animationType="slide"
          onRequestClose={() => setHistoryVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat history</Text>
              <Pressable
                onPress={() => setHistoryVisible(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close history"
              >
                <X size={22} color={colors.textPrimary} strokeWidth={2} />
              </Pressable>
            </View>
            {sessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No chats yet. Start a new chat.</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item.sessionId}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.previewItem}
                    onPress={() => handleOpenSession(item.sessionId)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open chat: ${item.title}`}
                  >
                    <View style={styles.previewIcon}>
                      <History size={18} color={colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewTitle}>{item.title}</Text>
                      <View style={styles.previewTimeRow}>
                        <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.previewTime}>
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </SafeAreaView>
        </Modal>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {messages.length === 0 ? (
            <CopilotWelcome
              onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
            />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
              ListFooterComponent={
                isLoading || isStreaming ? (
                  <ThinkingAnimation stepText={thinkingStep} />
                ) : null
              }
            />
          )}

          <CopilotInput
            value={inputText}
            onChangeText={setInputText}
            onSend={() => handleSendMessage()}
            disabled={isLoading || isStreaming}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    listContent: {
      paddingVertical: 16,
      paddingBottom: 150,
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-start',
      paddingTop: 70,
      paddingRight: 12,
      alignItems: 'flex-end',
    },
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      minWidth: 180,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    menuItemText: {
      ...Typography.bodySmall,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    modalTitle: {
      ...Typography.headlineMedium,
      color: colors.textHero,
      fontSize: 18,
      fontWeight: '700',
    },
    closeButton: {
      padding: 4,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyText: {
      ...Typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    previewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    previewIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewInfo: {
      flex: 1,
    },
    previewTitle: {
      ...Typography.bodySmall,
      color: colors.textHero,
      fontWeight: '600',
    },
    previewTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    previewTime: {
      ...Typography.labelSmall,
      color: colors.textSecondary,
      fontSize: 11,
    },
  })
